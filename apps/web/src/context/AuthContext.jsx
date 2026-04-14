import { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser && token) {
      setUser(JSON.parse(savedUser))
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
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
