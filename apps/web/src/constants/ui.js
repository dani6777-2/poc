/**
 * Global UI and Charting constants.
 */

import { fmt } from '../utils/formatters';

export const CHART_COLORS = {
  revenues: '#10b981',
  revenuesSoft: 'rgba(16, 185, 129, 0.05)',
  expenses: '#f43f5e',
  expensesSoft: 'rgba(244, 63, 94, 0.05)',
  accent: '#6366f1',
  accentSoft: 'rgba(99, 102, 241, 0.2)',
  purple: '#8b5cf6',
  warning: '#f59e0b',
  danger: '#ef4444',
  success: '#10b981',
  info: '#3b82f6',
  muted: '#64748b'
};

export const COMMON_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#94a3b8',
        font: { size: 11, weight: '900' },
        boxWidth: 10,
        usePointStyle: true
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      padding: 16,
      titleFont: { size: 14, weight: '900' },
      bodyFont: { size: 13 },
      borderColor: 'rgba(148, 163, 184, 0.1)',
      borderWidth: 1,
      cornerRadius: 16,
      callbacks: { label: ctx => ` ${fmt(ctx.raw)}` }
    }
  },
  scales: {
    x: {
      ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } },
      grid: { display: false }
    },
    y: {
      ticks: {
        color: '#64748b',
        callback: v => fmt(v),
        font: { size: 10 }
      },
      grid: { color: 'rgba(148, 163, 184, 0.05)' }
    }
  }
};
