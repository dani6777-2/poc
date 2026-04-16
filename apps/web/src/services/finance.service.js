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
  },

  // --- Taxonomy Categories CRUD ---
  createCategory: async (payload) => {
    const { data } = await api.post('taxonomy/categories', payload)
    return data
  },
  updateCategory: async (id, payload) => {
    const { data } = await api.put(`taxonomy/categories/${id}`, payload)
    return data
  },
  deleteCategory: async (id) => {
    const { data } = await api.delete(`taxonomy/categories/${id}`)
    return data
  },

  // --- Taxonomy Channels CRUD ---
  createChannel: async (payload) => {
    const { data } = await api.post('taxonomy/channels', payload)
    return data
  },
  updateChannel: async (id, payload) => {
    const { data } = await api.put(`taxonomy/channels/${id}`, payload)
    return data
  },
  deleteChannel: async (id) => {
    const { data } = await api.delete(`taxonomy/channels/${id}`)
    return data
  },

  // --- Taxonomy Sections CRUD ---
  createSection: async (payload) => {
    const { data } = await api.post('taxonomy/sections', payload)
    return data
  },
  updateSection: async (id, payload) => {
    const { data } = await api.put(`taxonomy/sections/${id}`, payload)
    return data
  },
  deleteSection: async (id) => {
    const { data } = await api.delete(`taxonomy/sections/${id}`)
    return data
  }
}
