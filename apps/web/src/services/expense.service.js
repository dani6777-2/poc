import api from '../api/client'

export const expenseService = {
  // Annual Planner (Structural Expenses)
  getAnnualExpenses: async (year) => {
    const { data } = await api.get(`expense-details/${year}`)
    return data
  },

  getAnnualExpenseNet: async (year) => {
    const { data } = await api.get(`expense-details/${year}/net`)
    return data
  },

  getAnnualExpenseStats: async (year, monthIdx) => {
    const { data } = await api.get(`expense-details/${year}/stats?month_idx=${monthIdx}`)
    return data
  },

  createExpenseDetail: async (payload) => {
    const { data } = await api.post('expense-details/', payload)
    return data
  },

  updateExpenseDetail: async (id, payload) => {
    const { data } = await api.put(`expense-details/${id}`, payload)
    return data
  },

  deleteExpenseDetail: async (id) => {
    const { data } = await api.delete(`expense-details/${id}`)
    return data
  },

  // Ledger Synchronization Protocol
  synchronizeLedger: async (year, dry_run = false) => {
    const { data } = await api.post('expense-details/ledger/synchronize', { year, dry_run })
    return data
  },

  calculateIntegrityStatus: async (year) => {
    const { data } = await api.get(`expense-details/ledger/integrity-status?year=${year}`)
    return data
  },

  // Legacy aliases (backward compatibility)
  reconcileSystem: async (year, dry_run = false) => {
    const { data } = await api.post('expense-details/ledger/synchronize', { year, dry_run })
    return data
  },

  getSystemHealth: async (year) => {
    const { data } = await api.get(`expense-details/ledger/integrity-status?year=${year}`)
    return data
  },

  // NEW FEATURES

  // Drift Timeline
  getDriftHistory: async (year, limit = 100) => {
    const { data } = await api.get(`expense-details/${year}/drift-history?limit=${limit}`)
    return data
  },

  // Simulation (What-If Mode)
  simulateScenario: async (year, changes) => {
    const { data } = await api.post('expense-details/simulate', { year, changes })
    return data
  },

  // Alerts
  getAlerts: async () => {
    const { data } = await api.get('expense-details/alerts')
    return data
  },

  acknowledgeAlert: async (alertId) => {
    const { data } = await api.post(`expense-details/alerts/${alertId}/acknowledge`)
    return data
  },

  // Edit Locks (Multi-user collaboration)
  acquireLock: async (resourceType, resourceId) => {
    const { data } = await api.post('expense-details/locks/acquire', { resource_type: resourceType, resource_id: resourceId })
    return data
  },

  releaseLock: async (resourceType, resourceId) => {
    const { data } = await api.post('expense-details/locks/release', { resource_type: resourceType, resource_id: resourceId })
    return data
  },

  getActiveLocks: async () => {
    const { data } = await api.get('expense-details/locks/active')
    return data
  },

  // Audit Trail
  getAuditTrail: async (resourceType, resourceId) => {
    const { data } = await api.get(`expense-details/audit/${resourceType}/${resourceId}`)
    return data
  },

  // Export/Import
  exportData: async (year) => {
    const { data } = await api.get(`expense-details/${year}/export`)
    return data
  },

  importData: async (payload) => {
    const { data } = await api.post('expense-details/import', payload)
    return data
  },

  // Registry (Transactional Expenses)
  getExpenses: async ({ month }) => {
    const { data } = await api.get(`expenses/?month=${month}`)
    return data
  },

  createExpense: async (payload, idempotencyKey = null) => {
    const headers = idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}
    const { data } = await api.post('expenses/', payload, { headers })
    return data
  },

  updateExpense: async (id, payload) => {
    const { data } = await api.put(`expenses/${id}`, payload)
    return data
  },

  deleteExpense: async (id) => {
    const { data } = await api.delete(`expenses/${id}`)
    return data
  },

  // Inventory Management (Block A & B combined)
  getInventoryBlock: async (block, { month }) => {
    const { data } = await api.get(`inventory/${block}/?month=${month}`)
    return data
  },

  createInventoryItem: async (block, payload) => {
    const { data } = await api.post(`inventory/${block}/`, payload)
    return data
  },

  updateInventoryItem: async (block, id, payload) => {
    const { data } = await api.put(`inventory/${block}/${id}`, payload)
    return data
  },

  deleteInventoryItem: async (block, id) => {
    const { data } = await api.delete(`inventory/${block}/${id}`)
    return data
  }
}
