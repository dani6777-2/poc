import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const value = useMemo(() => ({ addToast }), [addToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none items-end">
        {toasts.map(t => (
          <div 
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl glass border shadow-2xl animate-in slide-in-from-right-10 duration-300
              ${t.type === 'success' ? 'border-success/30 bg-success/5 text-success' : 
                t.type === 'danger' ? 'border-danger/30 bg-danger/5 text-danger' : 
                t.type === 'warning' ? 'border-warning/30 bg-warning/5 text-warning' : 
                'border-accent/30 bg-accent/5 text-tx-primary'}
            `}
          >
            <span className="text-lg">
              {t.type === 'success' ? '✅' : t.type === 'danger' ? '🚫' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <div className="flex flex-col">
              <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">
                {t.type === 'success' ? 'Completed' : t.type === 'danger' ? 'Error' : t.type === 'warning' ? 'Warning' : 'Information'}
              </p>
              <p className="text-[13px] font-bold opacity-80">{t.message}</p>
            </div>
            <button 
              onClick={() => removeToast(t.id)}
              className="ml-4 opacity-40 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
