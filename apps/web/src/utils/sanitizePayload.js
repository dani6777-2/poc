const NULLABLE_FIELDS = ["category_id", "channel_id", "unit_id", "prev_month_price", "date", "source"];
const NUMERIC_FIELDS = ["quantity", "unit_price"];
const ID_FIELDS = ["category_id", "channel_id", "unit_id"];

export function sanitizePayload(rawPayload) {
  return Object.keys(rawPayload).reduce((acc, key) => {
    let val = rawPayload[key];

    if (val === "" && NULLABLE_FIELDS.includes(key)) {
      val = null;
    }

    if (val === "" && NUMERIC_FIELDS.includes(key)) {
      val = 0;
    }

    if (ID_FIELDS.includes(key) && val !== null) {
      val = parseInt(val);
    }

    acc[key] = val;
    return acc;
  }, {});
}

export function sanitizeExpensePayload(form, month, overrideDuplicate = false) {
  return sanitizePayload({
    ...form,
    month,
    override_duplicate: overrideDuplicate
  });
}