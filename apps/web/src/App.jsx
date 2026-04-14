import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import { FinanceProvider } from './context/FinanceContext'
import Navbar from './components/organisms/Navbar'
import Dashboard from './pages/Dashboard'
import Registry from './pages/Registry'
import Budget from './pages/Budget'
import Analysis from './pages/Analysis'
import BlockA from './pages/BlockA'
import BlockB from './pages/BlockB'
import Revenues from './pages/Revenues'
import AnnualExpenses from './pages/AnnualExpenses'
import CreditCard from './pages/CreditCard'
import FinancialHealth from './pages/FinancialHealth'
import Login from './pages/Login'
import './index.css'

function AppContent() {
  const { token, loading } = useAuth()

  if (loading) return null

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen bg-primary text-tx-primary selection:bg-accent/30 font-sans">
      <Navbar />
      <main className="lg:ml-[280px] flex-1 p-6 md:p-10 min-h-screen relative z-10 transition-all duration-300">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/revenues" element={<Revenues />} />
          <Route path="/annual-expenses" element={<AnnualExpenses />} />
          <Route path="/registry" element={<Registry />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/card" element={<CreditCard />} />
          <Route path="/health" element={<FinancialHealth />} />
          <Route path="/block-a" element={<BlockA />} />
          <Route path="/block-b" element={<BlockB />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <FinanceProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </FinanceProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
