import api from '../api/client'

export const financeService = {
  getTaxonomies: async () => {
    const { data } = await api.get('taxonomy/')
    return data
  },

  getBudgets: async (month) => {
    const { data } = await api.get(`budgets/${month}`)
    return data
  },

  updateBudget: async (id, payload) => {
    const { data } = await api.put(`budgets/${id}`, payload)
    return data
  },

  createBudget: async (payload) => {
    const { data } = await api.post('budgets/', payload)
    return data
  }
}
