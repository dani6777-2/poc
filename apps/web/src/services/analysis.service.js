import api from '../api/client'

export const analysisService = {
  getAnalysis: async (month) => {
    const { data } = await api.get(`analysis/${month}`)
    return data
  },

  getHealthAlerts: async (month) => {
    const { data } = await api.get(`health/alerts/${month}`)
    return data
  },

  getAiForecast: async (month) => {
    const { data } = await api.get(`ai/forecast/${month}`)
    return data
  }
}
