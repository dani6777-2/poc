import { useState, useEffect, useMemo } from "react";
import { analysisService } from "../services";
import { RECENT_MONTHS } from "../constants/time";
import { NIVEL_COLOR } from "../constants/finance";
import { fmt } from "../utils/formatters";
import { useTheme } from "../context/ThemeContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import Card from "../components/atoms/Card";
import Button from "../components/atoms/Button";
import { Link } from "react-router-dom";
import { DashboardTemplate } from "../components/templates";

// Organisms
import HealthBanner from "../components/organisms/HealthBanner";
import AnalysisKpiGrid from "../components/organisms/AnalysisKpiGrid";
import CostVerticalAudit from "../components/organisms/CostVerticalAudit";
import SegmentationRadarPanel from "../components/organisms/SegmentationRadarPanel";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function Analysis() {
  const [month, setMonth] = useState(RECENT_MONTHS[0]);
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analysisService.getAnalysis(month),
      analysisService.getHealthAlerts(month).catch(() => null),
    ])
      .then(([anlData, healthData]) => {
        setData(anlData);
        setHealth(healthData);
      })
      .finally(() => setLoading(false));
  }, [month]);

  const kpis = data?.kpis || {};
  const planVsReal = data?.plan_vs_actual || [];
  const hasPlanVsActual = planVsReal.some((r) => r.planned > 0 || r.actual > 0);

  const healthMap = useMemo(() => {
    const map = {};
    if (health?.sections) {
      health.sections.forEach((s) => {
        map[s.section] = s;
      });
    }
    return map;
  }, [health]);

  const pvr = useMemo(
    () => planVsReal.filter((r) => r.planned > 0 || r.actual > 0),
    [planVsReal],
  );

  const barPvrData = {
    labels: pvr.map((r) => r.section),
    datasets: [
      {
        label: "Planned",
        data: pvr.map((r) => r.planned),
        backgroundColor: "rgba(99,102,241,0.2)",
        borderColor: "#6366f1",
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: "Actual Execution",
        data: pvr.map((r) => r.actual),
        backgroundColor: pvr.map((r) => {
          const s = healthMap[r.section];
          const c = s ? NIVEL_COLOR[s.level] : "#10b981";
          return `${c}44`;
        }),
        borderColor: pvr.map((r) => {
          const s = healthMap[r.section];
          return s ? NIVEL_COLOR[s.level] : "#10b981";
        }),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const channelsChart = {
    labels: data?.channels?.map((c) => c.channel) || [],
    datasets: [
      {
        label: "Total Spend ($)",
        data: data?.channels?.map((c) => c.total) || [],
        backgroundColor: [
          "rgba(99,102,241,0.4)",
          "rgba(16,185,129,0.4)",
          "rgba(245,158,11,0.4)",
          "rgba(239,68,68,0.4)",
          "rgba(139,92,246,0.4)",
          "rgba(59,130,246,0.4)",
          "rgba(20,184,166,0.4)",
        ],
        borderColor: [
          "#6366f1",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#3b82f6",
          "#14b8a6",
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: theme === "dark" ? "#94a3b8" : "#475569",
          font: { size: 10, weight: "900" },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor:
          theme === "dark"
            ? "rgba(15, 23, 42, 0.9)"
            : "rgba(255, 255, 255, 0.95)",
        titleColor: theme === "dark" ? "#f8fafc" : "#0f172a",
        bodyColor: theme === "dark" ? "#f8fafc" : "#0f172a",
        titleFont: { size: 12, weight: "900" },
        bodyFont: { size: 12 },
        padding: 16,
        cornerRadius: 16,
        borderColor: "rgba(148, 163, 184, 0.1)",
        borderWidth: 1,
        callbacks: { label: (ctx) => ` ${fmt(ctx.raw)}` },
      },
    },
    scales: {
      x: {
        ticks: { color: "#64748b", font: { size: 9, weight: "bold" } },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#64748b", callback: (v) => fmt(v), font: { size: 9 } },
        grid: { color: "rgba(148, 163, 184, 0.05)" },
      },
    },
  };

  return (
    <DashboardTemplate
      title={
        <>
          Financial{" "}
          <span className="text-accent italic font-light">Analytics</span>
        </>
      }
      subtitle="Distributed intelligence and advanced consumption patterns"
      icon="📊"
      badge={`Analysis Cycle ${month} Active`}
      loading={loading}
      headerAction={
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
      }
    >
      <HealthBanner health={health} />

      <AnalysisKpiGrid kpis={kpis} />


      <CostVerticalAudit
        hasPlanVsActual={hasPlanVsActual}
        pvr={pvr}
        healthMap={healthMap}
        health={health}
        barPvrData={barPvrData}
        chartOptions={chartOptions}
      />

      <SegmentationRadarPanel
        data={data}
        channelsChart={channelsChart}
        chartOptions={chartOptions}
        fmt={fmt}
      />
    </DashboardTemplate>
  );
}
