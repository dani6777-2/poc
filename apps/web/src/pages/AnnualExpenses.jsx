import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { expenseService, revenueService } from '../services';
import { MONTH_LABELS, MONTH_KEYS, ACTUAL_MONTH_KEYS, CARD_MONTH_KEYS, YEARS } from '../constants/finance';
import { fmt } from '../utils/formatters';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { DashboardTemplate } from '../components/templates';
import { StatBox, NewConceptModal, ConfirmModal } from '../components/molecules';
import { SectionBlock } from '../components/organisms';
import { Button } from '../components/atoms';

export default function AnnualExpenses() {
  const { sections, categories, loading: ctxLoading } = useFinance();
  const { addToast } = useToast();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [rows, setRows] = useState([]);
  const [revenues, setRevenues] = useState({ by_month: {}, annual_total: 0 });
  const [collapsed, setCollapsed] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [conceptModal, setConceptModal] = useState({ open: false, sectionId: null, categoryId: null });

  // 1. Data Orchestration
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [rowsData, revData] = await Promise.all([
        expenseService.getAnnualExpenses(year),
        revenueService.getRevenueSummary(year).catch(() => ({ by_month: {}, annual_total: 0 }))
      ]);
      setRows(rowsData);
      setRevenues(revData);
    } catch {
      addToast('Failed to sync financial vectors', 'danger');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [year, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 2. State Actions
  const handleCellChange = (id, field, value) => {
    setRows(prev => prev.map(r => r.id == id ? { ...r, [field]: value } : r));
  };

  const handleSaveRow = async (id) => {
    const current = rows.find(r => r.id == id);
    if (!current) return;

    // Sanitize payload
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
        fetchData(true);
      } else {
        addToast('Update failed', 'danger');
      }
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
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

  // 3. Computed Stats
  const rowsBySection = useMemo(() => {
    return rows.reduce((acc, r) => {
      acc[r.section_id] = acc[r.section_id] || [];
      acc[r.section_id].push(r);
      return acc;
    }, {});
  }, [rows]);

  const stats = useMemo(() => {
    const mKey = MONTH_KEYS[monthIdx];
    const rKey = ACTUAL_MONTH_KEYS[monthIdx];
    const cKey = CARD_MONTH_KEYS[monthIdx];

    const monthRev = revenues.by_month?.[mKey] || 0;
    const monthPlan = rows.reduce((s, r) => s + (parseFloat(r[mKey]) || 0), 0);
    const monthActual = rows.reduce((s, r) => s + (parseFloat(r[rKey]) || 0), 0);
    const monthCard = rows.reduce((s, r) => s + (parseFloat(r[cKey]) || 0), 0);
    const monthExec = monthActual + monthCard;

    return {
      monthRev,
      monthPlan,
      monthExec,
      monthDelta: monthPlan - monthExec,
      monthNet: monthRev - monthActual,
      annualPlan: rows.reduce((s, r) => s + MONTH_KEYS.reduce((sm, mk) => sm + (parseFloat(r[mk]) || 0), 0), 0),
      annualExec: rows.reduce((s, r) => s + [...ACTUAL_MONTH_KEYS, ...CARD_MONTH_KEYS].reduce((sm, mk) => sm + (parseFloat(r[mk]) || 0), 0), 0),
    };
  }, [rows, revenues, monthIdx]);

  return (
    <DashboardTemplate
      title={<>Annual <span className="text-accent italic font-light">Expense Matrix</span></>}
      subtitle="v5.0 Granular Financial Control System"
      icon="🏛️"
      loading={loading || ctxLoading}
      headerAction={
        <div className="flex gap-3 glass p-1.5 rounded-2xl shadow-sm">
          <select
            value={year} onChange={e => setYear(Number(e.target.value))}
            className="bg-transparent border-none text-xs font-black uppercase tracking-widest px-4 outline-none"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="w-px h-6 bg-border-base self-center" />
          <Button variant="ghost" size="sm" onClick={() => fetchData()} className="text-[10px] uppercase font-black tracking-widest px-4">Sync Data</Button>
        </div>
      }
    >
      {/* Month Selector */}
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

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatBox label="Month Revenue" value={fmt(stats.monthRev)} variant="success" subtext="Current Flow" />
        <StatBox label="Budgeted Plan" value={fmt(stats.monthPlan)} variant="warning" subtext={`${Math.round(stats.monthPlan / (stats.monthRev || 1) * 100)}% of revenue`} />
        <StatBox label="Actual Executed" value={fmt(stats.monthExec)} variant="purple" subtext="Cash + Credit" />
        <StatBox label="Net Liquidity" value={fmt(stats.monthNet)} variant={stats.monthNet >= 0 ? 'info' : 'danger'} subtext="Post-Actual Flow" />
      </div>

      {/* Main Grid */}
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

      {/* Modals */}
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
    </DashboardTemplate>
  );
}
