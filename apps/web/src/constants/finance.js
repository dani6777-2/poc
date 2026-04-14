export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
export const ACTUAL_MONTH_KEYS = ['actual_jan', 'actual_feb', 'actual_mar', 'actual_apr', 'actual_may', 'actual_jun', 'actual_jul', 'actual_aug', 'actual_sep', 'actual_oct', 'actual_nov', 'actual_dec']
export const CARD_MONTH_KEYS = ['actual_card_jan', 'actual_card_feb', 'actual_card_mar', 'actual_card_apr', 'actual_card_may', 'actual_card_jun', 'actual_card_jul', 'actual_card_aug', 'actual_card_sep', 'actual_card_oct', 'actual_card_nov', 'actual_card_dec']
export const YEARS = [2024, 2025, 2026, 2027]

export const SECCION_ICON = {
  Food: '🍽️',
  Home: '🏠',
  Pets: '🐾',
  Misc: '🗂️',
  'Fixed Expenses': '📌',
  Transport: '🚗',
  Health: '🏥',
  'Daily Life': '🎭',
  Debts: '💳',
  Savings: '🏦',
}

export const SECCION_COLOR = {
  'Fixed Expenses': { bg: 'var(--color-accent-soft)', accent: 'var(--color-accent)' },
  Home: { bg: 'var(--color-info-soft)', accent: 'var(--color-info)' },
  Transport: { bg: 'var(--color-warning-soft)', accent: 'var(--color-warning)' },
  Food: { bg: 'var(--color-success-soft)', accent: 'var(--color-success)' },
  Health: { bg: 'var(--color-teal-soft)', accent: 'var(--color-teal)' },
  'Daily Life': { bg: 'var(--color-purple-soft)', accent: 'var(--color-purple)' },
  Pets: { bg: 'var(--color-orange-soft)', accent: 'var(--color-orange)' },
  Misc: { bg: 'var(--color-slate-soft)', accent: 'var(--color-slate)' },
  Debts: { bg: 'var(--color-danger-soft)', accent: 'var(--color-danger)' },
  Savings: { bg: 'var(--color-success-soft)', accent: 'var(--color-success)' },
}

export const NIVEL_CFG = {
  ok: { color: 'var(--color-success)', bg: 'var(--color-success-soft)', border: 'var(--color-success-glow)', label: '✓ OK', icon: '🟢' },
  warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-soft)', border: 'var(--color-warning-glow)', label: '⚠ Attention', icon: '🟡' },
  danger: { color: 'var(--color-danger)', bg: 'var(--color-danger-soft)', border: 'var(--color-danger-glow)', label: '🚨 Critical', icon: '🔴' },
  no_data: { color: 'var(--color-tx-muted)', bg: 'var(--color-tx-primary-soft)', border: 'var(--color-border-base)', label: '— No data', icon: '⚪' },
}

export const NIVEL_COLOR = {
  ok:      '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  no_data: '#64748b',
}

export const NIVEL_ICON = { ok: '🟢', warning: '🟡', danger: '🔴', no_data: '⚪' }