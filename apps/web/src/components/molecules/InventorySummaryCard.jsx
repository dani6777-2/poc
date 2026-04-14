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
  variant = "accent",
  label = "Operating Expense Matrix",
  diversityLabel = "SKU Asset Diversity",
  unitLabel = "REGISTERED UNITS",
  fmt,
}) => {
  const gradientClass =
    variant === "success"
      ? "bg-linear-to-r from-success/10 to-transparent"
      : "bg-linear-to-r from-accent/10 to-transparent";

  const glowClass = variant === "success" ? "bg-success/5" : "bg-accent/5";

  return (
    <Card
      border={false}
      className={`p-6 lg:p-10 shadow-2xl relative overflow-hidden group ${gradientClass}`}
    >
      <div
        className={`absolute right-0 top-0 w-96 h-96 ${glowClass} rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none`}
      />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:p-12">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">
            {label}
          </label>
          <div className="text-5xl font-black text-tx-primary tabular-nums tracking-tighter transition-transform group-hover:scale-[1.01] origin-left drop-shadow-sm">
            {fmt(totalValue)}
          </div>
        </div>

        <div className="h-16 w-px bg-border-base hidden md:block" />

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
      </div>
    </Card>
  );
};

export default InventorySummaryCard;
