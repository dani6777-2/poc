import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import { Button, Input, Text } from '../components/atoms'
import { AuthTemplate } from '../components/templates'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await authService.register(email, password, tenantName)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed')
    }
  }

  return (
    <AuthTemplate 
      title="FinOps Registration" 
      subtitle="Create your workspace instance"
    >
      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl mb-8 flex items-center gap-3 animate-in shake-in duration-300">
          <span className="text-danger text-lg">🚫</span>
          <Text variant="caption" className="text-danger leading-tight">{error}</Text>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-6">
        <Input 
          label="Workspace Name"
          type="text" 
          value={tenantName} 
          onChange={e => setTenantName(e.target.value)} 
          placeholder="e.g. My Finances" 
          required 
        />
        <Input 
          label="Corporate Email"
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="you@organization.com" 
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
          Provision Workspace
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Text variant="caption" className="opacity-70 inline-block">
          Already have access?{' '}
        </Text>
        <Link to="/login" className="text-accent ml-2 hover:underline text-xs font-bold uppercase tracking-widest transition-all">
          Sign In
        </Link>
      </div>

      <div className="mt-8 text-center flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success"></span>
        <Text variant="caption" className="opacity-50">
          Protected by bank-grade encryption (AES-256)
        </Text>
      </div>
    </AuthTemplate>
  )
}
