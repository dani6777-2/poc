import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { expenseService, analysisService, ocrService } from "../services";
import { RECENT_MONTHS } from "../constants/time";
import { fmt } from "../utils/formatters";
import { isAutoExpense, getSourceLabel } from "../utils/finance";
import {
  DESPENSA_BLANK_STATE,
  SERVICIOS_BLANK_STATE,
  REGISTRY_BLANK_STATE,
  STATUS_OPTIONS,
  REGISTRY_FILTERS,
  PAYMENT_METHOD_OPTIONS,
} from "../constants/forms";
import { useToast } from "../context/ToastContext";
import { useFinance } from "../context/FinanceContext";
import { DashboardTemplate } from "../components/templates";
import KpiCard from "../components/molecules/KpiCard";
import RegistryForm from "../components/organisms/RegistryForm";
import RegistryTable from "../components/organisms/RegistryTable";
import ConfirmModal from "../components/molecules/ConfirmModal";
import OCRScanner from "../components/organisms/OCRScanner";
import { Button } from "../components/atoms";

// Must match seed_db.py section names
const SECTION_DESPENSA  = "Comida y Despensa";
const SECTION_SERVICIOS = "Servicios y Gastos Fijos";

export default function Registry() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("category_id") || "all";
  
  const setFilter = (val) => {
    if (val === "all") {
      searchParams.delete("category_id");
    } else {
      searchParams.set("category_id", val);
    }
    setSearchParams(searchParams);
  };

  const { addToast } = useToast();
  const {
    sections,
    categories,
    channels,
    units,
    loaded: taxonomiesLoaded,
  } = useFinance();

  const [month, setMonth] = useState(RECENT_MONTHS[0]);
  const [items, setItems] = useState([]);

  // --- Form type: 'despensa' | 'servicios' ---
  const [formType, setFormType] = useState("despensa");
  const [form, setForm] = useState(DESPENSA_BLANK_STATE);
  const [editId, setEditId] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmData, setConfirmData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  // --------------------------------------------------------
  // Data fetching
  // --------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsData, anlData] = await Promise.all([
        expenseService.getExpenses({ month }),
        analysisService.getAnalysis(month).catch(() => null),
      ]);
      setItems(itemsData);
      setAnalysis(anlData);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --------------------------------------------------------
  // Initialize / reset form when formType or taxonomies change
  // --------------------------------------------------------
  useEffect(() => {
    if (taxonomiesLoaded && !editId) {
      const today = new Date().toISOString().split("T")[0];
      const blankBase =
        formType === "servicios" ? SERVICIOS_BLANK_STATE : DESPENSA_BLANK_STATE;

      // Select first category of the target section
      const targetSectionName =
        formType === "servicios" ? SECTION_SERVICIOS : SECTION_DESPENSA;
      const targetSection = sections.find((s) => s.name === targetSectionName);
      const firstCatOfSection = targetSection
        ? categories.find((c) => c.section_id === targetSection.id)
        : categories[0];

      setForm({
        ...blankBase,
        date: today,
        category_id: firstCatOfSection?.id || categories[0]?.id || "",
        channel_id:
          channels.find((c) => c.name === "Cash")?.id || channels[0]?.id || "",
      });
    }
  }, [formType, sections, categories, channels, taxonomiesLoaded, editId]);

  // --------------------------------------------------------
  // CRUD Handlers
  // --------------------------------------------------------
  const handleSave = async (e) => {
    e?.preventDefault();
    setProcessing(true);
    try {
      const payload = {
        ...form,
        month,
        section_id: categories.find((c) => c.id === parseInt(form.category_id))
          ?.section_id,
      };

      if (editId) {
        await expenseService.updateExpense(editId, payload);
        addToast("Registry updated", "success");
      } else {
        await expenseService.createExpense(payload);
        addToast("Item registered successfully", "success");
      }

      setEditId(null);
      setForm(
        formType === "servicios" ? SERVICIOS_BLANK_STATE : DESPENSA_BLANK_STATE
      );
      fetchData();
    } catch {
      addToast("Failed to save registry", "danger");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await expenseService.deleteExpense(id);
      addToast("Registry removed", "success");
      fetchData();
    } catch {
      addToast("Error deleting registry", "danger");
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setForm(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatus = async (item) => {
    try {
      const newStatus = item.status === "Bought" ? "Pending" : "Bought";
      await expenseService.updateExpense(item.id, { ...item, status: newStatus });
      addToast(`Status updated to ${newStatus}`, "success");
      fetchData();
    } catch {
      addToast("Failed to update status", "danger");
    }
  };

  const handleOCRFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProcessing(true);
    try {
      const result = await ocrService.processImage(file);
      setOcrResult(result);
      addToast("AI Analysis completed", "success");
    } catch (err) {
      addToast("Visual analysis failed", "danger");
    } finally {
      setProcessing(false);
    }
  };

  const handleOCRBulkIngest = async () => {
    setProcessing(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const section_id = sections.find(s => s.name === SECTION_DESPENSA)?.id;
      
      for (const item of ocrResult) {
        await expenseService.createExpense({
          ...DESPENSA_BLANK_STATE,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          category_id: categories.find(c => c.section_id === section_id)?.id || categories[0]?.id,
          section_id,
          date: today,
          payment_method: 'Cash',
          status: 'Bought',
          month
        });
      }
      addToast(`${ocrResult.length} items ingested`, "success");
      setOcrResult(null);
      setScanning(false);
      fetchData();
    } catch (err) {
      addToast("Bulk ingestion failed", "danger");
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------------
  // Filters and Computed Data
  // --------------------------------------------------------
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory = filter === "all" || item.category_id === parseInt(filter);
      return matchesSearch && matchesCategory;
    });
  }, [items, search, filter]);

  return (
    <DashboardTemplate
      title={
        <>
          <span className="drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">📝</span>{" "}
          Expense Registry
        </>
      }
      subtitle="Operational Layer · Transactional Audit Flow"
      headerAction={
        <div className="flex items-center gap-4">
          <Button 
            variant="accent" 
            size="sm" 
            className="h-10 px-6 gap-2 bg-purple hover:bg-purple-light shadow-lg shadow-purple/20"
            onClick={() => setScanning(true)}
          >
            📸 AI Scan
          </Button>
          <div className="glass p-1 rounded-xl">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent border-none text-tx-primary font-bold px-4 py-2 cursor-pointer outline-none text-sm"
            >
              {RECENT_MONTHS.map((m) => (
                <option key={m} value={m} className="bg-secondary">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <RegistryForm
            formType={formType}
            setFormType={setFormType}
            form={form}
            setForm={setForm}
            handleSave={handleSave}
            categories={categories}
            channels={channels}
            units={units}
            isEditing={!!editId}
            onCancel={() => {
              setEditId(null);
              setForm(
                formType === "servicios"
                  ? SERVICIOS_BLANK_STATE
                  : DESPENSA_BLANK_STATE
              );
            }}
            processing={processing}
          />

          {scanning && (
            <OCRScanner
              onClose={() => setScanning(false)}
              processing={processing}
              ocrResult={ocrResult}
              handleFileUpload={handleOCRFileUpload}
              handleBulkIngest={handleOCRBulkIngest}
              onReset={() => setOcrResult(null)}
              fmt={fmt}
            />
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <KpiCard
              label="Monthly Spend"
              value={fmt(analysis?.kpis?.total_expense || 0)}
              variant="warning"
            />
            <KpiCard
              label="Cash Liquidity"
              value={fmt(analysis?.kpis?.cash_balance || 0)}
              variant="success"
            />
            <KpiCard
              label="Credit Debt"
              value={fmt(analysis?.kpis?.card_expense_annuals || 0)}
              variant="danger"
            />
          </div>

          <RegistryTable
            items={filteredItems}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            onEdit={handleEdit}
            onDelete={setConfirmData}
            onStatus={handleStatus}
            categories={categories}
            loading={loading}
          />
        </div>
      </div>

      {confirmData && (
        <ConfirmModal
          mensaje="Are you sure you want to delete this registry? This action cannot be undone."
          onConfirm={() => {
            handleDelete(confirmData);
            setConfirmData(null);
          }}
          onCancel={() => setConfirmData(null)}
        />
      )}
    </DashboardTemplate>
  );
}
