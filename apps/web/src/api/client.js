import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v3'

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    const detail = error?.response?.data?.detail
    const message = Array.isArray(detail)
      ? detail.map((d) => d?.msg).filter(Boolean).join(', ')
      : detail || error?.message || 'Error de red'

    return Promise.reject({
      status: error?.response?.status ?? 0,
      message,
      raw: error,
    })
  }
)

export async function safeRequest(requestPromise, fallbackData) {
  try {
    return await requestPromise
  } catch {
    return { data: fallbackData }
  }
}

export default api
