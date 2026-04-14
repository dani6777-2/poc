import api from '../api/client'

export const revenueService = {
  getRevenues: async (year) => {
    const { data } = await api.get(`revenues/${year}`)
    return data
  },

  getRevenueSummary: async (year) => {
    const { data } = await api.get(`revenues/${year}/summary`)
    return data
  },

  createRevenue: async (payload) => {
    const { data } = await api.post('revenues/', payload)
    return data
  },

  updateRevenue: async (id, payload) => {
    const { data } = await api.put(`revenues/${id}`, payload)
    return data
  },

  deleteRevenue: async (id) => {
    const { data } = await api.delete(`revenues/${id}`)
    return data
  }
}
