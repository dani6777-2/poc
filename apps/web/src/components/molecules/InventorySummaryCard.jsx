import React from "react";
import Card from "../atoms/Card";
import Badge from "../atoms/Badge";

/**
 * InventorySummaryCard
 * Displays global metrics for an inventory block.
 */
const InventorySummaryCard = ({
  totalValue,
  itemCount,
  items = [],
  variant = "accent",
  label = "Operating Expense Matrix",
  diversityLabel = "SKU Asset Diversity",
  performanceLabel = "Shopping Progress",
  unitLabel = "REGISTERED UNITS",
  fmt,
}) => {
  const gradientClass =
    variant === "success"
      ? "bg-linear-to-r from-success/10 to-transparent"
      : "bg-linear-to-r from-accent/10 to-transparent";

  const glowClass = variant === "success" ? "bg-success/5" : "bg-accent/5";

  // Calculate shopping progress
  const boughtCount = items.filter(i => i.status === 'Bought').length;
  const progressPercent = itemCount > 0 ? (boughtCount / itemCount) * 100 : 0;

  return (
    <Card
      border={false}
      className={`p-1 shadow-2xl relative overflow-hidden group ${gradientClass} transition-all duration-700 hover:shadow-glow-${variant}/10`}
    >
      <div
        className={`absolute right-0 top-0 w-96 h-96 ${glowClass} rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none transition-opacity duration-1000 ${totalValue === 0 ? 'opacity-40' : 'opacity-100'}`}
      />
      
      {totalValue === 0 && <div className="absolute inset-0 shimmer opacity-[0.03]" />}

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 lg:p-12">
        <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-12 flex-1">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">
              {label}
            </label>
            <div className="text-4xl lg:text-5xl font-black text-tx-primary tabular-nums tracking-tighter transition-transform group-hover:scale-[1.01] origin-left drop-shadow-sm">
              {fmt(totalValue)}
            </div>
          </div>

          <div className="h-16 w-px bg-border-base hidden lg:block opacity-40" />

          <div className="space-y-1">
            <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">
              {diversityLabel}
            </label>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-tx-secondary tabular-nums tracking-tighter">
                {itemCount}
              </div>
              <Badge variant="muted" className="tracking-widest opacity-60">
                {unitLabel}
              </Badge>
            </div>
          </div>

          <div className="h-16 w-px bg-border-base hidden lg:block opacity-40" />

          <div className="space-y-1">
            <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">
              {performanceLabel}
            </label>
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-black tabular-nums tracking-tighter ${totalValue > 0 ? (variant === 'success' ? 'text-success' : 'text-accent') : 'text-tx-muted opacity-20'}`}>
                {progressPercent.toFixed(1)}
                <span className="text-xs ml-1">%</span>
              </div>
              <Badge variant={progressPercent === 100 ? "success" : (progressPercent > 0 ? variant : "muted")} size="sm" className="opacity-60">
                {progressPercent === 100 ? "COMPLETED" : (progressPercent > 0 ? "IN_PROGRESS" : "PENDING")}
              </Badge>
            </div>
          </div>
        </div>

        <div className="hidden xl:flex flex-col items-end gap-2 pr-4">
          <div className="w-48 h-1.5 bg-tx-primary/10 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full ${variant === 'success' ? 'bg-success shadow-glow-success' : 'bg-accent shadow-glow-accent'} transition-all duration-1000 ease-out`} 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[8px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-30">Procurement Vector Alignment</span>
        </div>
      </div>
    </Card>
  );
};

export default InventorySummaryCard;
