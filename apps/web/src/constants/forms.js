/**
 * Default states and static options for application forms.
 */

export const REGISTRY_BLANK_STATE = { 
  name: '', 
  date: '',
  category_id: '', 
  channel_id: '', 
  payment_method: 'debit',
  unit_id: '', 
  quantity: 1, 
  unit_price: 0, 
  prev_month_price: '', 
  status: 'Planned' 
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'debit', label: 'Debit' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Transfer' }
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
