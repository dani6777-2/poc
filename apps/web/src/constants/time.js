export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
export const YEARS = [2024, 2025, 2026, 2027]

export const RECENT_MONTHS_WINDOW = 12;

export function recentMonths(count = RECENT_MONTHS_WINDOW) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - index)
    return date.toISOString().slice(0, 7)
  })
}

export const RECENT_MONTHS = recentMonths(RECENT_MONTHS_WINDOW);