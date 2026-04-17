/**
 * Default states and static options for application forms.
 */

// --- Legacy (generic) blank state ---
export const REGISTRY_BLANK_STATE = { 
  name: '', 
  date: '',
  category_id: '', 
  channel_id: '', 
  payment_method: 'cash',
  unit_id: '', 
  quantity: 1, 
  unit_price: 0, 
  prev_month_price: '', 
  status: 'Planned' 
};

// --- Despensa: consumo doméstico recurrente ---
// Supermercado, Frutas y verduras, Abarrotes, Artículos de aseo
export const DESPENSA_BLANK_STATE = {
  name: '',
  date: '',
  category_id: '',
  channel_id: '',
  payment_method: 'cash',
  unit_id: '',
  quantity: 1,
  unit_price: 0,
  prev_month_price: '',
  status: 'Bought', // Despensa usually bought immediately
};

// --- Servicios: gastos fijos/cuentas del hogar ---
// Luz, Agua, Internet, Gas, Otros
export const SERVICIOS_BLANK_STATE = {
  name: '',
  date: '',
  category_id: '',
  channel_id: '',
  payment_method: 'cash',
  unit_id: '',
  quantity: 1,     // always 1 for services
  unit_price: 0,   // total amount
  prev_month_price: '',
  status: 'Bought',
};

// Payment methods per spec: cash (descuenta saldo) / credit (acumula deuda)
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: '💵 Efectivo' },
  { value: 'credit', label: '💳 Tarjeta de Crédito' },
];

export const INVENTORY_BLOCK_A_DEFAULT = (month, category_id = '') => ({
  month,
  category_id,
  name: '',
  unit_id: '',
  quantity: '',
  channel_id: '',
  unit_price: '',
  prev_month_price: ''
});

export const INVENTORY_BLOCK_B_DEFAULT = (month, category_id = '') => ({
  month,
  category_id,
  name: '',
  channel_id: '',
  unit_id: '',
  price_per_kg: '',
  prev_month_price: ''
});

export const STATUS_OPTIONS = [
  { value: 'Planned', label: 'Planned' },
  { value: 'Bought', label: 'Bought' }
];

export const REGISTRY_FILTERS = [
  { id: 'all', label: '🌍 View All' },
  { id: 'bought', label: 'Bought' },
  { id: 'planned', label: 'Planned' },
  { id: 'auto', label: 'Auto' },
  { id: 'manual', label: 'Manual' }
];
