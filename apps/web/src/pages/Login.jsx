import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import { Button, Input, Text } from '../components/atoms'
import { AuthTemplate } from '../components/templates'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await authService.login(email, password)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid Credentials')
    }
  }

  return (
    <AuthTemplate 
      title="FinOps Home 4.0" 
      subtitle="Enterprise Intelligence Platform"
    >
      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl mb-8 flex items-center gap-3 animate-in shake-in duration-300">
          <span className="text-danger text-lg">🚫</span>
          <Text variant="caption" className="text-danger leading-tight">{error}</Text>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <Input 
          label="Corporate Email"
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="admin@finops.test" 
          required 
        />
        <Input 
          label="Secret Key"
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="••••••••" 
          required 
        />
        <Button type="submit" className="w-full h-14 mt-4">
          Access Terminal
        </Button>
      </form>

      <div className="mt-12 text-center flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success"></span>
        <Text variant="caption" className="opacity-50">
          Protected by bank-grade encryption (AES-256)
        </Text>
      </div>
    </AuthTemplate>
  )
}
