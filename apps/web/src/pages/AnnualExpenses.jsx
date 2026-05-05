import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { expenseService, revenueService } from '../services';
import { MONTH_LABELS, MONTH_KEYS, ACTUAL_MONTH_KEYS, CARD_MONTH_KEYS, YEARS } from '../constants/finance';
import { fmt } from '../utils/formatters';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { DashboardTemplate } from '../components/templates';
import { StatBox, NewConceptModal, ConfirmModal, FilterPanel, FilterBadge } from '../components/molecules';
import { SectionBlock } from '../components/organisms';
import { Button } from '../components/atoms';
import { useOptimisticMutation } from '../hooks/useFetchData';
import { DriftTimelineModal, DriftIndicator } from '../components/molecules/DriftIndicator';
import { AlertPanel, ConflictResolutionModal, SyncPreviewModal, SimulationModal } from '../components/molecules/FeatureModals';

export default function AnnualExpenses() {
  const { sections, categories, loading: ctxLoading } = useFinance();
  const { addToast } = useToast();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [rows, setRows] = useState([]);
  const [revenues, setRevenues] = useState({ by_month: {}, annual_total: 0 });
  const [statsData, setStats] = useState({});
  const [healthStatus, setHealthStatus] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [conceptModal, setConceptModal] = useState({ open: false, sectionId: null, categoryId: null });
  
  // NEW: Feature states
  const [showDriftModal, setShowDriftModal] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [conflictModal, setConflictModal] = useState(null);
  const [syncPreview, setSyncPreview] = useState(null);
  const [optimisticState, setOptimisticState] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(null);
  const focusedCellRef = useRef(null);

  // Optimistic mutation for row updates
  const { mutate: mutateRow } = useOptimisticMutation(
    ({ id, payload }) => expenseService.updateExpenseDetail(id, payload),
    {
      onError: (err, { id }) => {
        if (err.status === 409) {
          const serverRow = rows.find(r => r.id === id);
          setConflictModal({
            localValue: optimisticState[id],
            serverValue: serverRow,
            field: 'value',
            resourceType: 'expense_detail'
          });
        }
        addToast('Update failed: ' + (err.message || 'Unknown error'), 'danger');
      }
    }
  );

  // 1. Data Orchestration
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [rowsData, revData, statsResp, healthData] = await Promise.all([
        expenseService.getAnnualExpenses(year),
        revenueService.getRevenueSummary(year).catch(() => ({ by_month: {}, annual_total: 0 })),
        expenseService.getAnnualExpenseStats(year, monthIdx).catch(() => ({})),
        expenseService.getSystemHealth(year).catch(() => (null))
      ]);
      setRows(rowsData);
      setRevenues(revData);
      setStats(statsResp);
      setHealthStatus(healthData);
    } catch {
      addToast('Failed to sync financial vectors', 'danger');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [year, monthIdx, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          e.target.blur();
        } else if (e.key === 'Enter' && e.ctrlKey) {
          const rowId = e.target.dataset.rowId;
          if (rowId) handleSaveRow(parseInt(rowId));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rows]);

  // 2. State Actions - OPTIMISTIC UI
  const handleCellChange = (id, field, value) => {
    // Optimistic update
    setRows(prev => prev.map(r => r.id == id ? { ...r, [field]: value } : r));
    setOptimisticState(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveRow = async (id) => {
    const current = rows.find(r => r.id == id);
    if (!current) return;

    const payload = { ...current };
    Object.keys(payload).forEach(key => {
      if (['id', 'tenant_id', 'section_name', 'category_name', 'concept_label'].includes(key)) return;
      if (payload[key] === '') payload[key] = null;
      else if (typeof payload[key] === 'string' && !isNaN(payload[key]) && key !== 'description') {
        payload[key] = parseFloat(payload[key]);
      }
    });

    setSaving(s => ({ ...s, [id]: true }));
    try {
      await expenseService.updateExpenseDetail(id, payload);
      addToast('Vector synchronized', 'success');
      fetchData(true);
    } catch (err) {
      if (err.status === 409) {
        addToast('Concurrency Conflict: Refreshing...', 'warning');
        setConflictModal({
          localValue: optimisticState[id],
          serverValue: current,
          field: 'value',
          resourceType: 'expense_detail'
        });
        fetchData(true);
      } else {
        addToast('Update failed', 'danger');
      }
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
      setOptimisticState(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const handleDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    try {
      await expenseService.deleteExpenseDetail(id);
      addToast('Concept terminated', 'success');
      fetchData();
    } catch {
      addToast('Deletion failed', 'danger');
    }
  };

  const handleCreateConcept = async (payload) => {
    setLoading(true);
    try {
      await expenseService.createExpenseDetail({
        ...payload,
        sort_order: 10,
        is_automatic: false,
        concept_origin: 'manual'
      });
      addToast('Manual concept initialized', 'success');
      setConceptModal({ open: false, sectionId: null, categoryId: null });
      fetchData();
    } catch {
      addToast('Creation failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSynchronize = async (preview = false) => {
    setReconciling(true);
    try {
      if (preview) {
        const result = await expenseService.synchronizeLedger(year, true);
        setSyncPreview({
          changes: result.differences || [],
          affected_records: result.affected_records || 0
        });
      } else {
        const result = await expenseService.synchronizeLedger(year, false);
        if (result.status === 'CHANGES_DETECTED') {
          addToast(`Ledger Sync: ${result.affected_records} corrections applied`, 'success');
        } else {
          addToast('Ledger Sync: INTEGRITY_OK - data synchronized', 'info');
        }
        fetchData(true);
      }
    } catch (err) {
      addToast('Ledger Sync failed', 'danger');
    } finally {
      setReconciling(false);
    }
  };

  const handleConflictResolve = async () => {
    if (!conflictModal) return;
    const id = parseInt(conflictModal.serverValue?.id);
    if (id) {
      await handleSaveRow(id);
    }
    setConflictModal(null);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilter = (key) => {
    setFilters(f => {
      const newF = { ...f };
      delete newF[key];
      return Object.keys(newF).length === 0 ? null : newF;
    });
  };

  // 3. Computed Stats with Filters
  const filteredRows = useMemo(() => {
    if (!filters) return rows;
    return rows.filter(r => {
      if (filters.is_automatic !== null && r.is_automatic !== filters.is_automatic) return false;
      if (filters.concept_origin && r.concept_origin !== filters.concept_origin) return false;
      if (filters.category_id && r.category_id !== filters.category_id) return false;
      return true;
    });
  }, [rows, filters]);

  const rowsBySection = useMemo(() => {
    return filteredRows.reduce((acc, r) => {
      acc[r.section_id] = acc[r.section_id] || [];
      acc[r.section_id].push(r);
      return acc;
    }, {});
  }, [filteredRows]);

  const stats = useMemo(() => {
    if (statsData && Object.keys(statsData).length > 0) {
      return {
        monthRev: statsData.month_rev || 0,
        monthPlan: statsData.month_plan || 0,
        monthExec: statsData.month_exec || 0,
        monthDelta: statsData.month_delta || 0,
        monthNet: statsData.month_net || 0,
        annualPlan: statsData.annual_plan || 0,
        annualExec: statsData.annual_exec || 0,
      };
    }
    const mKey = MONTH_KEYS[monthIdx];
    const rKey = ACTUAL_MONTH_KEYS[monthIdx];
    const cKey = CARD_MONTH_KEYS[monthIdx];

    const monthRev = revenues.by_month?.[mKey] || 0;
    const monthPlan = rows.reduce((s, r) => s + (parseFloat(r[mKey]) || 0), 0);
    const monthActual = rows.reduce((s, r) => s + (parseFloat(r[rKey]) || 0), 0);
    const monthCard = rows.reduce((s, r) => s + (parseFloat(r[cKey]) || 0), 0);
    const monthExec = monthActual;

    return {
      monthRev,
      monthPlan,
      monthExec,
      monthDelta: monthPlan - monthExec,
      monthNet: monthRev - monthActual,
      annualPlan: rows.reduce((s, r) => s + MONTH_KEYS.reduce((sm, mk) => sm + (parseFloat(r[mk]) || 0), 0), 0),
      annualExec: rows.reduce((s, r) => s + ACTUAL_MONTH_KEYS.reduce((sm, mk) => sm + (parseFloat(r[mk]) || 0), 0), 0),
    };
  }, [rows, revenues, monthIdx, statsData]);

  return (
    <DashboardTemplate
      title={<>Annual <span className="text-accent italic font-light">Expense Matrix</span></>}
      subtitle="v5.0 Granular Financial Control System"
      icon="🏛️"
      loading={loading || ctxLoading || reconciling}
      headerAction={
        <div className="flex gap-3 glass p-1.5 rounded-2xl shadow-sm">
          {healthStatus && (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${healthStatus.status === 'INTEGRITY_OK' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-[10px] uppercase font-black tracking-widest text-tx-secondary">
                {healthStatus.status === 'INTEGRITY_OK' ? 'SYNC' : 'DRIFT'}
              </span>
            </div>
          )}
          {healthStatus && healthStatus.status !== 'INTEGRITY_OK' && (
            <span className="text-[9px] text-amber-400 font-medium" title={`Imbalance: ${healthStatus.imbalance_delta}`}>
              Δ{healthStatus.imbalance_delta}
            </span>
          )}
          
          <DriftIndicator year={year} onDriftClick={() => setShowDriftModal(true)} />
          
          <div className="w-px h-6 bg-border-base self-center" />
          <select
            value={year} onChange={e => setYear(Number(e.target.value))}
            className="bg-transparent border-none text-xs font-black uppercase tracking-widest px-4 outline-none"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="w-px h-6 bg-border-base self-center" />
          <Button variant="ghost" size="sm" onClick={() => fetchData()} className="text-[10px] uppercase font-black tracking-widest px-4">Sync Data</Button>
          <Button variant="ghost" size="sm" onClick={() => handleSynchronize(true)} disabled={reconciling} className="text-[10px] uppercase font-black tracking-widest px-4 text-blue-400">Preview</Button>
          <Button variant="ghost" size="sm" onClick={() => handleSynchronize(false)} disabled={reconciling} className="text-[10px] uppercase font-black tracking-widest px-4 text-accent">Sync</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSimulation(true)} className="text-[10px] uppercase font-black tracking-widest px-4 text-purple-400">Simulate</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(true)} className="text-[10px] uppercase font-black tracking-widest px-4 text-gray-400">Filters</Button>
        </div>
      }
    >
      <AlertPanel />
      
      <div className="flex gap-2 glass p-2 rounded-2xl overflow-x-auto no-scrollbar shadow-premium mb-8">
        {MONTH_LABELS.map((label, i) => (
          <button
            key={i} onClick={() => setMonthIdx(i)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap tracking-[0.2em] ${monthIdx === i ? 'bg-accent text-white shadow-glow-accent' : 'text-tx-secondary hover:bg-tx-primary/10'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatBox label="Month Revenue" value={fmt(stats.monthRev)} variant="success" subtext="Current Flow" />
        <StatBox label="Budgeted Plan" value={fmt(stats.monthPlan)} variant="warning" subtext={`${Math.round(stats.monthPlan / (stats.monthRev || 1) * 100)}% of revenue`} />
        <StatBox label="Actual Executed" value={fmt(stats.monthExec)} variant="purple" subtext="Cash + Credit" />
        <StatBox label="Net Liquidity" value={fmt(stats.monthNet)} variant={stats.monthNet >= 0 ? 'info' : 'danger'} subtext="Post-Actual Flow" />
      </div>

      <div className="space-y-10 pb-20">
        {sections.map(sec => (
          <SectionBlock
            key={sec.id}
            section={sec}
            categories={categories}
            rowsBySection={rowsBySection}
            monthKey={MONTH_KEYS[monthIdx]}
            realMonthKey={ACTUAL_MONTH_KEYS[monthIdx]}
            cardMonthKey={CARD_MONTH_KEYS[monthIdx]}
            collapsed={collapsed[sec.id]}
            onToggleCollapse={(id) => setCollapsed(c => ({ ...c, [id]: !c[id] }))}
            saving={saving}
            onCellChange={handleCellChange}
            onSave={handleSaveRow}
            onDelete={setConfirmId}
            onAddConcept={(secId, catId) => setConceptModal({ open: true, sectionId: secId, categoryId: catId })}
          />
        ))}
      </div>

      {confirmId && (
        <ConfirmModal
          mensaje="Terminate this financial vector? This action is permanent."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <NewConceptModal
        isOpen={conceptModal.open}
        onClose={() => setConceptModal({ open: false, sectionId: null, categoryId: null })}
        onConfirm={handleCreateConcept}
        year={year}
        sectionId={conceptModal.sectionId}
        categoryId={conceptModal.categoryId}
      />

      <DriftTimelineModal year={year} isOpen={showDriftModal} onClose={() => setShowDriftModal(false)} />
      
      <ConflictResolutionModal
        isOpen={!!conflictModal}
        conflictData={conflictModal}
        onResolve={handleConflictResolve}
        onCancel={() => setConflictModal(null)}
      />

      <SyncPreviewModal
        isOpen={!!syncPreview}
        previewData={syncPreview}
        onConfirm={() => { setSyncPreview(null); handleSynchronize(false); }}
        onCancel={() => setSyncPreview(null)}
      />

      <SimulationModal isOpen={showSimulation} year={year} onClose={() => setShowSimulation(false)} />

      <FilterPanel 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)} 
        filters={filters} 
        onApply={handleApplyFilters} 
      />

      {filters && (
        <div className="fixed bottom-4 left-4">
          <FilterBadge filters={filters} onClear={handleClearFilter} />
        </div>
      )}
    </DashboardTemplate>
  );
}
