import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Card from '../components/atoms/Card'

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
    <div className="min-h-screen bg-primary flex items-center justify-center p-6 sm:p-8">
      <Card className="max-w-[440px] w-full p-10 md:p-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-[0_0_40px_rgba(99,102,241,0.4)] animate-pulse">
            💰
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-tx-primary tracking-tighter mb-2 drop-shadow-sm">
            FinOps Home <span className="text-accent">4.0</span>
          </h2>
          <p className="text-tx-secondary text-[13px] font-bold uppercase tracking-[0.2em] opacity-40">
            Enterprise Intelligence Platform
          </p>
        </div>
        
        {error && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl mb-8 flex items-center gap-3 animate-in shake-in duration-300">
            <span className="text-danger text-lg">🚫</span>
            <p className="text-danger text-[13px] font-black leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-8">
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

        <div className="mt-12 pt-8 border-t border-border-base text-center">
          <p className="text-[10px] font-bold text-tx-muted uppercase tracking-widest opacity-30 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            Protected by bank-grade encryption (AES-256)
          </p>
        </div>
      </Card>
    </div>
  )
}
