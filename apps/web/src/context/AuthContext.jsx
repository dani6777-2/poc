import { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [activeTenant, setActiveTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      // On init/refresh, always start in primary home
      setActiveTenant({
        id: parsedUser.tenant_id,
        name: parsedUser.tenant_name,
        role: 'owner'
      })
      sessionStorage.setItem('activeTenantId', parsedUser.tenant_id)
    }
    setLoading(false)
  }, [token])

  const login = (tokenData) => {
    const userData = {
      id: tokenData.user_id,
      email: tokenData.email,
      tenant_id: tokenData.tenant_id,
      tenant_name: tokenData.tenant_name
    }
    localStorage.setItem('token', tokenData.access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(tokenData.access_token)
    setUser(userData)
    setActiveTenant({
      id: userData.tenant_id,
      name: userData.tenant_name,
      role: 'owner'
    })
    sessionStorage.setItem('activeTenantId', userData.tenant_id)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('activeTenantId')
    setToken(null)
    setUser(null)
    setActiveTenant(null)
  }

  const switchTenant = (tenantData) => {
    setActiveTenant(tenantData)
    if (tenantData) {
      sessionStorage.setItem('activeTenantId', tenantData.id)
    }
  }

  useEffect(() => {
    if (activeTenant?.role === 'guest') {
      document.documentElement.setAttribute('data-view-mode', 'guest')
    } else {
      document.documentElement.removeAttribute('data-view-mode')
    }
  }, [activeTenant])

  return (
    <AuthContext.Provider value={{ user, token, activeTenant, loading, login, logout, switchTenant }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
