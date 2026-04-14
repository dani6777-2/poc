import api from '../api/client'

export const ocrService = {
  upload: async (formData) => {
    const { data } = await api.post('/ocr/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  ingest: async (payload) => {
    const { data } = await api.post('/ocr/ingest', payload)
    return data
  }
}
