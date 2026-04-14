import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardTemplate } from "../components/templates";
import { analysisService, expenseService } from "../services";
import { MONTH_LABELS, MONTH_KEYS, YEARS } from "../constants/finance";
import { RECENT_MONTHS } from "../constants/time";
import { fmt } from "../utils/formatters";
import { COMMON_CHART_OPTIONS, CHART_COLORS } from "../constants/ui";
import Card from "../components/atoms/Card";
import Badge from "../components/atoms/Badge";
import Button from "../components/atoms/Button";
import HealthScore from "../components/molecules/HealthScore";
import KpiCard from "../components/molecules/KpiCard";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

import InsightPanel from "../components/organisms/InsightPanel";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler,
);

const Skeleton = ({ className }) => (
  <div
    className={`animate-pulse bg-tx-primary/5 rounded-[2rem] ${className}`}
  />
);

export default function Dashboard() {
  const [month, setMonth] = useState(RECENT_MONTHS[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [analysis, setAnalysis] = useState(null);
  const [netData, setNetData] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [anlData, netData, aiData] = await Promise.all([
        analysisService.getAnalysis(month),
        expenseService.getAnnualExpenseNet(year).catch(() => []),
        analysisService.getAiForecast(month).catch(() => null),
      ]);
      setAnalysis(anlData);
      setNetData(netData);
      setForecast(aiData);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = analysis?.kpis || {};

  const lineData = useMemo(
    () => ({
      labels:
        netData?.map((n) => MONTH_LABELS[MONTH_KEYS.indexOf(n.month)]) || [],
      datasets: [
        {
          label: "Revenues",
          data: netData?.map((n) => n.revenues) || [],
          borderColor: CHART_COLORS.success,
          backgroundColor: CHART_COLORS.revenuesSoft,
          borderWidth: 4,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: CHART_COLORS.success,
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
        {
          label: "Expenses",
          data: netData?.map((n) => n.expenses) || [],
          borderColor: CHART_COLORS.expenses,
          backgroundColor: CHART_COLORS.expensesSoft,
          borderWidth: 4,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: CHART_COLORS.expenses,
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
      ],
    }),
    [netData],
  );

  return (
    <DashboardTemplate
      title={
        <>
          Strategic Executive{" "}
          <span className="text-accent italic font-light">Dashboard</span>
        </>
      }
      subtitle="Predictive financial analytics and capital management"
      badge="Enterprise Core Protocol 4.5"
      icon="🏦"
      loading={loading}
      headerAction={
        <div className="flex items-center gap-3">
          <div className="glass flex items-center p-1 rounded-2xl shadow-premium border border-border-base/40 bg-secondary/60">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent border-none text-tx-primary font-black px-4 py-2 cursor-pointer outline-none text-xs uppercase tracking-widest"
            >
              {RECENT_MONTHS.map((m) => (
                <option key={m} value={m} className="bg-secondary">
                  {m}
                </option>
              ))}
            </select>
            <span className="w-px h-6 bg-tx-primary/10 mx-1"></span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent border-none text-tx-primary font-black px-4 py-2 cursor-pointer outline-none text-xs uppercase tracking-widest"
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-secondary">
                  {y}
                </option>
              ))}
            </select>
          </div>
          <Link to="/analysis">
            <Button
              variant="accent"
              size="sm"
              className="px-6 font-black uppercase tracking-widest h-12 shadow-glow-accent"
            >
              AI Panel
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr] gap-5 md:p-8">
          <Card
            interactive
            className="p-6 lg:p-10 flex items-center gap-6 lg:p-10 border-none shadow-premium relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent opacity-30" />
            <HealthScore score={forecast?.health_score || 0} />
            <div className="flex flex-col gap-6 flex-1 border-l border-border-base/40 pl-10">
              <div className="space-y-1">
                <label className="text-[10px] text-tx-muted font-black uppercase tracking-[0.3em] opacity-40 block">
                  Savings Rate
                </label>
                <strong
                  className={`text-3xl font-black tabular-nums tracking-tighter transition-all ${(forecast?.savings_rate || 0) > 10 ? "text-success" : "text-warning"}`}
                >
                  {forecast?.savings_rate || 0}%
                </strong>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-tx-muted font-black uppercase tracking-[0.3em] opacity-40 block">
                  Projected Expense
                </label>
                <strong className="text-3xl font-black text-tx-primary tabular-nums tracking-tighter whitespace-nowrap drop-shadow-sm">
                  {fmt(forecast?.projected_expense)}
                </strong>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <KpiCard
              badge="Revenue Flow"
              variant="success"
              glow
              value={fmt(kpis.total_revenue)}
              className="flex-1"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-success/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />
              <div className="border-t border-border-base/40 pt-6 mt-6">
                <label className="text-[10px] uppercase text-tx-muted font-black tracking-[0.3em] mb-2 opacity-30 block">
                  Operational Expense Rate
                </label>
                <div className="text-3xl font-black text-tx-primary tabular-nums tracking-tighter">
                  {fmt(kpis.actual_expense)}
                </div>
              </div>
            </KpiCard>

            <KpiCard
              label="Net Liquidity"
              variant={kpis.cash_balance < 0 ? "danger" : "accent"}
              glow={kpis.cash_balance < 0}
              value={fmt(kpis.cash_balance)}
              className="flex-1"
            >
              <Badge
                variant={kpis.cash_balance < 0 ? "danger" : "success"}
                className="absolute bottom-10 right-10 font-black uppercase tracking-widest text-[8px]"
              >
                {kpis.cash_balance < 0 ? "Deficit" : "Surplus"}
              </Badge>
            </KpiCard>
          </div>

          <Card
            interactive
            className="p-6 lg:p-10 flex flex-col justify-center gap-5 md:p-8 border-none shadow-premium bg-linear-to-br from-secondary to-transparent"
          >
            <h4 className="text-[11px] uppercase font-black text-tx-muted mb-2 tracking-[0.4em] opacity-40">
              AI Asset Location
            </h4>
            <div className="space-y-8">
              <div className="space-y-3.5">
                <div className="text-[11px] flex justify-between font-black uppercase tracking-widest">
                  <span className="text-tx-secondary opacity-60">
                    Essential Consumption
                  </span>
                  <span className="text-tx-primary">
                    {forecast?.kpis_detail?.essential_ratio || 0}%
                  </span>
                </div>
                <div className="h-2 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
                  <div
                    className="h-full bg-accent rounded-full shadow-glow-accent transition-all duration-1000"
                    style={{
                      width: `${forecast?.kpis_detail?.essential_ratio || 0}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="space-y-3.5">
                <div className="text-[11px] flex justify-between font-black uppercase tracking-widest">
                  <span className="text-tx-secondary opacity-60">
                    Vulnerability
                  </span>
                  <span className="text-tx-primary">
                    {forecast?.kpis_detail?.vulnerability || 0}%
                  </span>
                </div>
                <div className="h-2 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
                  <div
                    className="h-full bg-purple rounded-full shadow-glow-purple transition-all duration-1000"
                    style={{
                      width: `${forecast?.kpis_detail?.vulnerability || 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-tx-muted font-bold uppercase italic opacity-20 tracking-tighter leading-relaxed">
              Dataset synchronized with biometric prediction clusters.
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:p-10">
          <Card className="p-6 lg:p-10 shadow-premium border-none">
            <div className="flex items-center justify-between mb-12 px-2">
              <div>
                <h3 className="text-[13px] font-black text-tx-primary uppercase tracking-[0.4em]">
                  Economic Flow Analytics
                </h3>
                <p className="text-[11px] text-tx-muted font-bold uppercase tracking-widest mt-2 opacity-30">
                  Historical trend of 12 cyclic periods
                </p>
              </div>
              <div className="flex gap-5 md:p-8 text-[11px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-50">
                <span className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-success shadow-glow-success"></span>{" "}
                  Inflow
                </span>
                <span className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger shadow-glow-danger"></span>{" "}
                  Outflow
                </span>
              </div>
            </div>
            <div className="h-[420px] w-full">
              <Line data={lineData} options={COMMON_CHART_OPTIONS} />
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <InsightPanel insights={forecast?.insights || []} />
            <Link to="/health" className="relative z-10 mt-auto">
              <Button
                className="w-full py-6 rounded-[1.5rem] uppercase font-black tracking-[0.3em] text-[11px] shadow-glow-accent"
                variant="primary"
              >
                Full Health Diagnosis →
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-6 md:p-12 shadow-premium border-none relative overflow-hidden">
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="flex items-center justify-between mb-12 px-4 relative z-10">
            <div className="space-y-1">
              <h3 className="text-[14px] font-black text-tx-primary uppercase tracking-[0.4em]">
                Active Portfolio Categories
              </h3>
              <p className="text-[10px] font-bold text-tx-muted uppercase tracking-widest opacity-30">
                Capital distribution by operating segment
              </p>
            </div>
            <Link to="/budget">
              <Button
                variant="ghost"
                size="sm"
                className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40 hover:opacity-100 hover:text-accent"
              >
                Manage Ceilings →
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:p-8 relative z-10">
            {analysis?.category_chart?.slice(0, 8).map((c) => {
              const ratio = c.budget > 0 ? (c.actual / c.budget) * 100 : 0;
              return (
                <div
                  key={c.category}
                  className="bg-tx-primary/[0.03] p-6 rounded-[2rem] border border-border-base/40 space-y-5 transition-all hover:bg-tx-primary/[0.08] hover:-translate-y-1 group group/cat shadow-lg"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-tx-muted uppercase tracking-widest group-hover/cat:text-accent transition-colors truncate pr-2 opacity-50">
                      {c.category}
                    </span>
                    <div className="flex justify-between items-end">
                      <span className="text-xl font-black text-tx-primary tabular-nums tracking-tighter group-hover/cat:text-tx-primary transition-colors">
                        {fmt(c.actual)}
                      </span>
                      <span
                        className={`text-[10px] font-black tabular-nums transition-colors ${ratio > 100 ? "text-danger" : "text-tx-muted"}`}
                      >
                        {ratio.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
                    <div
                      className="h-full transition-all duration-1000 rounded-full"
                      style={{
                        width: `${Math.min(ratio, 100)}%`,
                        background: ratio > 100 ? "#ef4444" : "#6366f1",
                        boxShadow: `0 0 10px ${ratio > 100 ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {(!analysis?.category_chart ||
              analysis.category_chart.length === 0) && (
              <div className="col-span-full py-20 text-center opacity-20 grayscale uppercase font-black tracking-[0.4em] text-xs">
                No data segmentation available
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardTemplate>
  );
}
