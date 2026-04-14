import api from '../api/client'

export const inventoryService = {
  // Block A
  getBlockA: async (month) => {
    const { data } = await api.get(`/inventory/block-a/?month=${month}`)
    return data
  },
  createBlockA: async (payload) => {
    const { data } = await api.post('/inventory/block-a/', payload)
    return data
  },
  updateBlockA: async (id, payload) => {
    const { data } = await api.put(`/inventory/block-a/${id}`, payload)
    return data
  },
  deleteBlockA: async (id) => {
    const { data } = await api.delete(`/inventory/block-a/${id}`)
    return data
  },

  // Block B
  getBlockB: async (month) => {
    const { data } = await api.get(`/inventory/block-b/?month=${month}`)
    return data
  },
  createBlockB: async (payload) => {
    const { data } = await api.post('/inventory/block-b/', payload)
    return data
  },
  updateBlockB: async (id, payload) => {
    const { data } = await api.put(`/inventory/block-b/${id}`, payload)
    return data
  },
  deleteBlockB: async (id) => {
    const { data } = await api.delete(`/inventory/block-b/${id}`)
    return data
  }
}
