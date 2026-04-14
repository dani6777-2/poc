import React from "react";
import { Link } from "react-router-dom";
import Card from "../atoms/Card";
import { fmt } from "../../utils/formatters";

const AnalysisKpiGrid = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
      <Card interactive className="p-6 border-t-2 border-success/20">
        <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] block mb-2 opacity-50">
          Total Revenue
        </label>
        <div className="text-2xl font-black text-success tabular-nums">
          {fmt(kpis.total_revenue)}
        </div>
        <Link
          to="/revenues"
          className="inline-block mt-4 text-[9px] font-black text-accent-light hover:underline uppercase tracking-widest opacity-60"
        >
          View Matrix →
        </Link>
      </Card>

      <Card interactive className="p-6 border-t-2 border-border-base">
        <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] block mb-2 opacity-50">
          Budget
        </label>
        <div className="text-2xl font-black text-tx-primary tabular-nums">
          {fmt(kpis.planned_expense)}
        </div>
        <div className="text-[9px] font-black text-tx-muted mt-2 opacity-30 uppercase">
          From Annual Planner
        </div>
      </Card>

      <Card interactive className="p-6 border-t-2 border-warning/20">
        <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] block mb-2 opacity-50">
          Actual Expense (Cash)
        </label>
        <div className="text-2xl font-black text-warning tabular-nums">
          {fmt(kpis.actual_expense)}
        </div>
        <div className="text-[9px] font-black text-warning/40 mt-2 uppercase">
          Cash Settlement
        </div>
      </Card>

      <Card interactive className="p-6 border-t-2 border-accent/20">
        <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] block mb-2 opacity-50">
          Monthly Variance
        </label>
        <div
          className={`text-2xl font-black tabular-nums ${kpis.cash_balance < 0 ? "text-danger" : "text-success"}`}
        >
          {fmt(kpis.cash_balance)}
        </div>
        <div className="text-[9px] font-black text-tx-muted mt-2 opacity-30 uppercase">
          {kpis.projected_balance !== undefined &&
            `Net Card: ${fmt(kpis.projected_balance)}`}
        </div>
      </Card>

      <Card
        interactive
        className="p-6 border-t-2 border-purple/20 col-span-2 lg:col-span-1"
      >
        <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] block mb-2 opacity-50">
          Consumption Rate
        </label>
        <div className="space-y-3">
          <div
            className={`text-2xl font-black tabular-nums ${kpis.executed_pct >= 100 ? "text-danger" : kpis.executed_pct >= 80 ? "text-warning" : "text-purple"}`}
          >
            {kpis.executed_pct}%
          </div>
          <div className="h-1.5 bg-tx-primary/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${kpis.executed_pct >= 100 ? "bg-danger shadow-glow-danger" : "bg-purple shadow-glow-purple"}`}
              style={{ width: `${Math.min(kpis.executed_pct || 0, 100)}%` }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalysisKpiGrid;
