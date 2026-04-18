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

  reconcileSystem: async (year) => {
    const { data } = await api.post('expense-details/system/reconcile', { year })
    return data
  },

  getSystemHealth: async (year) => {
    const { data } = await api.get(`expense-details/system/health?year=${year}`)
    return data
  },


  // Registry (Transactional Expenses)
  getExpenses: async ({ month }) => {
    const { data } = await api.get(`expenses/?month=${month}`)
    return data
  },

  createExpense: async (payload) => {
    const { data } = await api.post('expenses/', payload)
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
