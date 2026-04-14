import api from '../api/client'

export const cardService = {
  getCardBalance: async (month) => {
    const { data } = await api.get(`/card/balance/${month}`)
    return data
  },

  getCardHistory: async (month) => {
    const { data } = await api.get(`/card/history/${month}`)
    return data
  },

  getCardConfig: async () => {
    const { data } = await api.get('/card/config')
    return data
  },

  updateCardConfig: async (payload) => {
    const { data } = await api.put('/card/config', payload)
    return data
  },

  syncCard: async (month) => {
    const { data } = await api.post(`/card/sync/${month}`)
    return data
  }
}
