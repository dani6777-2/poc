import React from "react";
import { useAuth } from "../../context/AuthContext";
import Badge from "../atoms/Badge";
import Button from "../atoms/Button";

/**
 * InventoryItemRow
 * Shared row component for Block A and Block B tables.
 */
const InventoryItemRow = ({
  item,
  onEdit,
  onDelete,
  onToggleStatus,
  fmt,
  type = "block-a",
}) => {
  const { activeTenant } = useAuth();
  const isGuest = activeTenant?.role === "guest";
  const isBought = item.status === "Bought";

  // Logic from Block A
  const diffA = item.prev_month_price
    ? item.unit_price - item.prev_month_price
    : null;
  // Logic from Block B
  const deltaB = item.delta_precio || 0;
  const hasDeltaB = item.prev_month_price && item.prev_month_price > 0;

  return (
    <tr className={`hover:bg-tx-primary/[0.02] transition-colors group ${isBought ? 'opacity-40 grayscale-[0.5]' : ''}`}>
      <td className="p-7 pl-10 relative">
        {/* Status Indicator Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${isBought ? 'bg-success shadow-glow-success' : 'bg-tx-primary/10'}`} />

        <div className="flex items-center gap-4">
          {!isGuest && (
            <button
              onClick={() => onToggleStatus(item)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 active:scale-90 ${isBought
                  ? 'bg-success border-success text-tx-secondary shadow-glow-success'
                  : 'border-tx-primary/20 hover:border-accent text-transparent'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}

          <div>
            <div className={`text-[13px] font-black group-hover:text-accent transition-all uppercase tracking-widest leading-none mb-1.5 ${isBought ? 'line-through text-tx-muted opacity-60' : 'text-tx-primary'}`}>
              {item.name}
            </div>
            <div className="text-[8px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-30 flex items-center gap-2">
              <span className="w-2 h-0.5 bg-tx-muted/20" />
              {isBought ? 'TRANSACTION_ID: ' : (type === "block-a" ? "ID_REF: " : "BATCH_ID: ")}
              {item.id.toString(16).toUpperCase()}
            </div>
          </div>
        </div>
      </td>
      <td className="p-7 text-center">
        <Badge variant="muted" size="sm" className="font-black px-4 bg-tx-primary/5 border-tx-primary/10">
          {item.category_name}
        </Badge>
      </td>
      <td className="p-7 text-center">
        <Badge variant="muted" size="sm" className="font-black px-4 bg-tx-primary/5 border-tx-primary/10">
          {type === "block-a"
            ? item.unit_name || "N/A"
            : item.unit_name || "Kg"}
        </Badge>
      </td>

      {type === "block-a" ? (
        <td className="p-7 text-center font-black tabular-nums text-[13px] text-tx-primary">
          {item.quantity || "0"}
        </td>
      ) : null}

      <td className="p-7">
        <span className="text-[10px] font-bold text-tx-muted uppercase truncate block opacity-60 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-tx-muted/40" />
          {item.channel_name ||
            (type === "block-a" ? "DIRECT_FEED" : "PUBLIC_MARKET")}
        </span>
      </td>

      <td className="p-7 text-right font-black tabular-nums text-[13px] text-tx-secondary">
        {type === "block-a"
          ? item.unit_price
            ? fmt(item.unit_price)
            : "—"
          : fmt(item.price_per_kg)}
      </td>

      <td className="p-7 text-right font-black tabular-nums text-lg text-tx-primary drop-shadow-glow-muted">
        {fmt(item.subtotal)}
      </td>

      <td className="p-7 text-center">
        {type === "block-a" ? (
          item.prev_month_price ? (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[8px] font-black text-tx-muted opacity-20 tabular-nums">
                PREV: {fmt(item.prev_month_price)}
              </span>
              {diffA !== null && (
                <div
                  className={`text-[10px] font-black flex items-center gap-1.5 px-2 py-0.5 rounded-md ${diffA > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}
                >
                  {diffA > 0 ? "▲" : "▼"} {fmt(Math.abs(diffA))}
                </div>
              )}
            </div>
          ) : (
            <Badge variant="accent" size="sm" className="scale-75 opacity-30 shadow-glow-accent">
              NEW_NODE
            </Badge>
          )
        ) : hasDeltaB ? (
          <Badge
            variant={deltaB > 0 ? "danger" : deltaB < 0 ? "success" : "muted"}
            className="px-5 tracking-tighter shadow-sm"
          >
            {deltaB > 0 ? "▲ INC" : deltaB < 0 ? "▼ DEC" : "STABLE"}{" "}
            {fmt(Math.abs(deltaB))}
          </Badge>
        ) : (
          <span className="text-[9px] font-black text-tx-muted opacity-10 uppercase tracking-widest border border-tx-muted/10 px-2 py-1 rounded">
            UNTRACKED
          </span>
        )}
      </td>

      <td className="p-7 text-right pr-10">
        {!isGuest && (
          <div className="flex gap-2.5 justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="w-10 h-10 p-0 rounded-xl hover:bg-accent/10 hover:text-accent border border-transparent hover:border-accent/20 transition-all font-black"
            >
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="w-10 h-10 p-0 rounded-xl hover:bg-danger/10 hover:text-danger border border-transparent hover:border-danger/20 transition-all font-black"
            >
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default InventoryItemRow;
