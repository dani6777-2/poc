import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { revenueService } from "../services";
import { MONTH_KEYS, MONTH_LABELS } from "../constants/finance";
import { fmt } from "../utils/formatters";
import { DashboardTemplate } from "../components/templates";
import Badge from "../components/atoms/Badge";
import Button from "../components/atoms/Button";
import ConfirmModal from "../components/molecules/ConfirmModal";
import { useToast } from "../context/ToastContext";

// Molecules
import RevenueFlowCard from "../components/molecules/RevenueFlowCard";

// Organisms
import RevenueMatrixTable from "../components/organisms/RevenueMatrixTable";
import RevenueSourceModal from "../components/organisms/RevenueSourceModal";

const totalRow = (row) =>
  MONTH_KEYS.reduce((s, m) => s + (parseFloat(row[m]) || 0), 0);

export default function Revenues() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [modal, setModal] = useState(false);
  const [newSource, setNewSource] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const saveTimers = useRef({});
  const rowsRef = useRef([]);
  const { addToast } = useToast();

  // Sync Ref with state so debounce always sees the latest
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await revenueService.getRevenues(year);
      setRows(data);
    } catch (e) {
      console.error(e);
      addToast("Error connecting to revenue vault", "danger");
    } finally {
      setLoading(false);
    }
  }, [year, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCellChange = (id, field, value) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: numValue } : r)),
    );
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(
      () => saveRow(id, field, numValue),
      800,
    );
  };

  const saveRow = async (id, field, value) => {
    setSaving((s) => ({ ...s, [id]: true }));
    const currentRow = rowsRef.current.find((r) => r.id === id);
    if (!currentRow) {
      setSaving((s) => ({ ...s, [id]: false }));
      return;
    }
    try {
      await revenueService.updateRevenue(id, { [field]: value });
    } catch (e) {
      addToast("Failed to persist revenue entry", "danger");
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  };

  const handleAddSource = async () => {
    if (!newSource.trim()) return;
    try {
      await revenueService.createRevenue({
        year,
        source: newSource.trim(),
        sort_order: rows.length,
      });
      addToast("New flow source injected successfully", "success");
      setNewSource("");
      setModal(false);
      fetchData();
    } catch (e) {
      addToast("Error registering new source", "danger");
    }
  };

  const handleDeleteConfirm = async () => {
    const id = confirmId;
    setConfirmId(null);
    clearTimeout(saveTimers.current[id]);
    delete saveTimers.current[id];

    setRows((prev) => prev.filter((r) => r.id !== id));
    try {
      await revenueService.deleteRevenue(id);
      addToast("Revenue source removed from matrix", "warning");
    } catch (e) {
      addToast("Failed to de-list the source", "danger");
      fetchData();
    }
  };

  const totalsByMonth = MONTH_KEYS.map((m) =>
    rows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0),
  );
  const totalAnnual = totalsByMonth.reduce((a, b) => a + b, 0);

  return (
    <DashboardTemplate
      title={
        <>
          Revenue{" "}
          <span className="text-success italic font-light">Streams</span>
        </>
      }
      subtitle={`CFO Management: Annual revenue planning and audit for cycle ${year}`}
      icon="💰"
      badge={`Fiscal Audit ${year} Active`}
      loading={loading}
      loadingText="Scanning revenue architecture..."
      headerAction={
        <div className="flex items-center gap-3">
          <div className="glass p-1 rounded-xl flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0 rounded-lg hover:bg-tx-primary/5"
              onClick={() => setYear(year - 1)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            <span className="px-5 font-black text-tx-primary text-base tabular-nums">
              {year}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0 rounded-lg hover:bg-tx-primary/5"
              onClick={() => setYear(year + 1)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </div>
          <Button
            onClick={() => setModal(true)}
            variant="accent"
            size="sm"
            className="px-8 font-black uppercase tracking-[0.2em] h-12 shadow-glow-accent"
          >
            + Inject Source
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:p-8">
        <RevenueFlowCard
          label="Consolidated Annual Revenue"
          variant="success"
          value={fmt(totalAnnual)}
          badge={`PROJECTED ${year}`}
        />

        <RevenueFlowCard
          label="Stable Monthly Distribution"
          value={fmt(totalAnnual / 12)}
          subtitle="Optimized cash flow"
        />

        <RevenueFlowCard
          label="Active Revenue Vectors"
          value={rows.length}
          subtitle="Risk differentiation"
        >
          <Badge
            variant="accent"
            size="sm"
            className="tracking-[0.3em] opacity-60 font-black uppercase text-[9px] mt-2"
          >
            CHANNELS
          </Badge>
        </RevenueFlowCard>
      </div>

      <RevenueMatrixTable
        rows={rows}
        loading={loading}
        saving={saving}
        MONTH_LABELS={MONTH_LABELS}
        MONTH_KEYS={MONTH_KEYS}
        onCellChange={handleCellChange}
        onDeleteRequest={setConfirmId}
        totalsByMonth={totalsByMonth}
        totalAnnual={totalAnnual}
        totalRow={totalRow}
        fmt={fmt}
      />

      {modal && (
        <RevenueSourceModal
          newSource={newSource}
          setNewSource={setNewSource}
          year={year}
          onClose={() => setModal(false)}
          onAdd={handleAddSource}
        />
      )}

      {confirmId !== null && (
        <ConfirmModal
          mensaje={`Confirm total de-listing of source "${rows.find((r) => r.id === confirmId)?.source}"? All annual historical vectors will be permanently purged.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </DashboardTemplate>
  );
}
