import api from '../api/client'

export const expenseService = {
  // Annual Planner (Structural Expenses)
  getAnnualExpenses: async (year) => {
    const { data } = await api.get(`/expense-details/${year}`)
    return data
  },

  getAnnualExpenseNet: async (year) => {
    const { data } = await api.get(`/expense-details/${year}/net`)
    return data
  },

  createAnnualExpense: async (payload) => {
    const { data } = await api.post('/expense-details/', payload)
    return data
  },

  updateAnnualExpense: async (id, payload) => {
    const { data } = await api.put(`/expense-details/${id}`, payload)
    return data
  },

  deleteAnnualExpense: async (id) => {
    const { data } = await api.delete(`/expense-details/${id}`)
    return data
  },

  // Registry (Transactional Expenses)
  getExpenses: async (month) => {
    const { data } = await api.get(`/expenses/?month=${month}`)
    return data
  },

  createExpense: async (payload) => {
    const { data } = await api.post('/expenses/', payload)
    return data
  },

  updateExpense: async (id, payload) => {
    const { data } = await api.put(`/expenses/${id}`, payload)
    return data
  },

  deleteExpense: async (id) => {
    const { data } = await api.delete(`/expenses/${id}`)
    return data
  }
}
