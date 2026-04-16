import React from "react";
import Card from "../atoms/Card";
import Badge from "../atoms/Badge";
import InsightItem from "../molecules/InsightItem";

const InsightPanel = ({ insights }) => {
  return (
    <Card className="p-6 lg:p-8 flex flex-col border border-border-base shadow-md relative bg-secondary hover:shadow-lg transition-all duration-500 rounded-[2rem] h-full overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-black text-tx-primary tracking-tighter uppercase leading-none">
            AI Intelligence
          </h3>
          <Badge
            variant="accent"
            size="sm"
            className="font-black uppercase tracking-[0.4em] text-[8px] px-3 py-1 w-fit"
          >
            NEURAL_AUDIT_ACTIVE
          </Badge>
        </div>
        <div className="w-10 h-10 border border-border-base/40 rounded-xl flex items-center justify-center text-tx-muted text-xs animate-pulse">
          🧠
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {insights.map((insight, index) => (
          <InsightItem key={index} insight={insight} index={index} />
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-border-base/40 relative z-10">
        <p className="text-[10px] font-medium text-tx-muted/40 uppercase tracking-widest leading-relaxed">
          Proprietary algorithms are actively auditing the data spectrum for
          anomalies and strategic liquidity optimizations in real-time.
        </p>
      </div>
    </Card>
  );
};

export default InsightPanel;
