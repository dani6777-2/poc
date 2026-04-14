/**
 * Global utility functions for formatting data.
 */

/**
 * Formats a number as USD currency.
 * @param {number} n - The number to format.
 * @param {number} fractionDigits - Maximum fraction digits (default 0).
 * @returns {string} Formatted currency string.
 */
export const fmt = (n, fractionDigits = 0) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: fractionDigits,
  }).format(n || 0);
};

/**
 * Formats a percentage.
 * @param {number} n - The decimal percentage.
 * @returns {string} Formatted percentage string.
 */
export const fmtPct = (n) => {
  return `${(n * 100).toFixed(1)}%`;
};
