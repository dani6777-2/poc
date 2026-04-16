import api from '../api/client'

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('auth/login', { email, password })
    return data
  },
  register: async (email, password, tenant_name) => {
    const { data } = await api.post('auth/register', { email, password, tenant_name })
    return data
  }
}
