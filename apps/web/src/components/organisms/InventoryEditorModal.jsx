import React from "react";
import Card from "../atoms/Card";
import Badge from "../atoms/Badge";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Select from "../atoms/Select";
import InventoryField from "../molecules/InventoryField";

/**
 * InventoryEditorModal
 * Unified modal for creating/editing inventory assets in Block A or B.
 */
const InventoryEditorModal = ({
  modal,
  setModal,
  editing,
  form,
  handleChange,
  handleSubmit,
  catOptions,
  canalOptions,
  unitOptions,
  subtotalValue,
  fmt,
  type = "block-a",
}) => {
  if (!modal) return null;

  const isSuccess = type === "block-b";
  const protocol =
    type === "block-a" ? "INVENTORY_PROTOCOL_A" : "PERISHABLE_PROTOCOL_B";
  const title = editing
    ? type === "block-a"
      ? "Edit Matrix Entry"
      : "Edit Fresh Entry"
    : type === "block-a"
      ? "Manual Asset Registry"
      : "New Market Ingestion";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div
        className="absolute inset-0 bg-primary/95 backdrop-blur-xl"
        onClick={() => setModal(false)}
      />
      <Card className="w-full max-w-2xl p-10 md:p-14 relative z-10 animate-in zoom-in-95 duration-500 rounded-[3rem]">
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-tx-primary uppercase tracking-tighter leading-none">
              {title}
            </h2>
            <Badge
              variant={isSuccess ? "success" : "accent"}
              className={`tracking-[0.4em] opacity-80 ${isSuccess ? "text-primary" : ""}`}
            >
              {protocol}
            </Badge>
          </div>
          <Button
            variant="ghost"
            className="w-12 h-12 p-0 rounded-2xl text-tx-muted hover:text-tx-primary"
            onClick={() => setModal(false)}
          >
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InventoryField
              label="Asset Descriptor / SKU"
              className="md:col-span-2"
            >
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder={
                  type === "block-a"
                    ? "e.g. Premium Basmati Evolution"
                    : "e.g. Avocado Hass Selected"
                }
              />
            </InventoryField>

            <InventoryField label="Category">
              <Select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                options={catOptions}
              />
            </InventoryField>

            <InventoryField
              label={
                type === "block-a" ? "Acquisition Channel" : "Market Channel"
              }
            >
              <Select
                name="channel_id"
                value={form.channel_id}
                onChange={handleChange}
                options={canalOptions}
              />
            </InventoryField>

            <InventoryField label="Unit">
              <Select
                name="unit_id"
                value={form.unit_id}
                onChange={handleChange}
                options={unitOptions}
              />
            </InventoryField>

            {type === "block-a" ? (
              <>
                <InventoryField label="Load Quota (Quantity)">
                  <Input
                    name="quantity"
                    type="number"
                    step="0.01"
                    value={form.quantity}
                    onChange={handleChange}
                    className="font-black tabular-nums"
                  />
                </InventoryField>

                <InventoryField label="Entry Price ($)">
                  <Input
                    name="unit_price"
                    type="number"
                    value={form.unit_price}
                    onChange={handleChange}
                    className="font-black tabular-nums"
                  />
                </InventoryField>
              </>
            ) : (
              <InventoryField label="Current Market Rate ($)">
                <Input
                  name="price_per_kg"
                  type="number"
                  value={form.price_per_kg}
                  onChange={handleChange}
                  className="font-black tabular-nums"
                />
              </InventoryField>
            )}

            <InventoryField
              label="Previous Reference ($)"
              className={type === "block-b" ? "md:col-span-2" : ""}
            >
              <Input
                name="prev_month_price"
                type="number"
                value={form.prev_month_price}
                onChange={handleChange}
                className="font-black tabular-nums opacity-60"
                placeholder={
                  type === "block-b" ? "Optional for delta tracking" : ""
                }
              />
            </InventoryField>
          </div>

          {subtotalValue > 0 && type === "block-a" && (
            <Card
              border={false}
              className="p-8 bg-success/5 border border-success/20 flex items-center justify-between rounded-3xl"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-black text-success uppercase tracking-[0.3em] leading-none">
                  Calculated Investment
                </label>
              </div>
              <div className="text-3xl font-black text-tx-primary tabular-nums drop-shadow-glow-accent">
                {fmt(subtotalValue)}
              </div>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-5 mt-14">
            <Button
              type="submit"
              variant={isSuccess ? "success" : "accent"}
              className={`flex-1 py-7 uppercase tracking-[0.3em] ${isSuccess ? "text-primary" : ""}`}
            >
              {editing
                ? "Update Architecture"
                : type === "block-a"
                  ? "Commit New Asset"
                  : "Register produce"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModal(false)}
              className="px-12 py-7 uppercase tracking-[0.2em] border border-border-base"
            >
              Dismiss
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default InventoryEditorModal;
