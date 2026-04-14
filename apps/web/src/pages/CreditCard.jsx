import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { recentMonths } from '../constants/time'
import { useFinance } from '../context/FinanceContext'
import PageHeader from '../components/molecules/PageHeader'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Select from '../components/atoms/Select'
import { useToast } from '../context/ToastContext'

const RECENT_MONTHS = recentMonths(12)
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

export default function CreditCard() {
  const { channels } = useFinance()
  const [month, setMonth] = useState(RECENT_MONTHS[0])
  const [balance, setBalance] = useState(null)
  const [history, setHistory] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [formCfg, setFormCfg] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [balRes, histRes, cfgRes] = await Promise.all([
        api.get(`/card/balance/${month}`),
        api.get(`/card/history/${month}`),
        api.get('/card/config')
      ])
      setBalance(balRes.data)
      setHistory(histRes.data)
      setFormCfg(cfgRes.data)
    } catch (e) { 
      console.error(e)
      addToast('Error loading financial data', 'error')
    }
    finally { setLoading(false) }
  }, [month, addToast])

  useEffect(() => { fetchData() }, [fetchData])

  const saveConfig = async () => {
    setSaving(true)
    try {
        const payload = {
            ...formCfg,
            channel_id: parseInt(formCfg.channel_id) || null,
            total_limit: parseFloat(formCfg.total_limit) || 0,
            alert_threshold: parseFloat(formCfg.alert_threshold) || 0,
            closing_day: parseInt(formCfg.closing_day) || 1,
            payment_day: parseInt(formCfg.payment_day) || 1
        }
      await api.put('/card/config', payload)
      addToast('Configuration updated successfully', 'success')
      setIsEditing(false)
      fetchData()
    } catch (e) {
      addToast('Error saving configuration', 'error')
    } finally {
      setSaving(false)
    }
  }

  const syncNow = async () => {
    try {
      await api.post(`/card/sync/${month}`)
      addToast('Delta synchronization completed', 'success')
      fetchData()
    } catch (e) {
      addToast('Synchronization failed', 'error')
    }
  }

  const channelOptions = useMemo(() => channels.map(c => ({ value: c.id, label: c.name })), [channels])

  if (loading && !balance) {
    return (
      <div className="py-40 flex flex-col items-center gap-4 animate-pulse">
        <div className="w-10 h-10 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-tx-muted">Scanning credit architecture...</p>
      </div>
    )
  }

  const pct = balance?.used_pct || 0
  const colorVariant = pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'success'
  const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981'

  return (
    <div className="page-entry pb-20 space-y-10">
      <PageHeader 
        title={<>Credit Card <span className="text-accent italic font-light">Manager</span></>}
        subtitle="Operational cycle monitoring and liability management"
        icon="💳"
        badge="Financial Protocol v4.5 Active"
        actions={
          <div className="flex items-center gap-3">
            <div className="glass p-1 rounded-xl">
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="bg-transparent border-none text-tx-primary font-bold px-4 py-2 cursor-pointer outline-none text-sm"
              >
                {RECENT_MONTHS.map(m => <option key={m} value={m} className="bg-secondary">{m}</option>)}
              </select>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="accent" size="sm" className="px-6 font-black uppercase tracking-widest h-11">
              Configure
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-10 items-start">
        {/* PHYSICAL CARD VISUAL */}
        <div className="flex flex-col gap-8">
          <Card border={false} className="h-64 p-10 relative overflow-hidden flex flex-col justify-between shadow-premium group transition-all duration-700 select-none cursor-default bg-linear-to-br from-tx-primary/[0.08] to-tx-primary/[0.01] rounded-[2.5rem]">
            {/* Animated Glow Overlay */}
            <div className="absolute inset-0 bg-linear-to-tr from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent rounded-full blur-[100px] opacity-[0.1] group-hover:opacity-[0.2] transition-opacity duration-700" />

            <div className="flex justify-between items-start z-10">
              <div className="flex flex-col gap-1">
                <span className="text-xl font-black text-tx-primary uppercase tracking-[0.2em] drop-shadow-md">{balance?.name || "VIRTUAL NODE"}</span>
                <Badge variant="accent" size="sm" className="w-fit opacity-80 tracking-[0.3em] font-black">INFINITE LEVEL</Badge>
              </div>
              <div className="w-12 h-10 glass rounded-lg flex items-center justify-center text-xl filter drop-shadow-glow-accent">📡</div>
            </div>

            <div className="z-10 group-hover:translate-x-1 transition-transform duration-500">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.25em] block mb-2 opacity-40">Settlement Balance</label>
              <div className="text-5xl font-black text-tx-primary tabular-nums tracking-tighter drop-shadow-2xl">{fmt(balance?.used)}</div>
            </div>

            <div className="flex justify-between items-end z-10 border-t border-border-base/40 pt-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-40">Available Liquidity</label>
                <div className={`text-base font-black tabular-nums tracking-tight ${balance?.available > 0 ? 'text-success' : 'text-danger'}`}>{fmt(balance?.available)}</div>
              </div>
              <div className="text-right space-y-1">
                <label className="text-[9px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-40">Total Limit</label>
                <div className="text-base font-black text-tx-primary tabular-nums tracking-tight">{fmt(balance?.total_limit)}</div>
              </div>
            </div>
          </Card>

          <Card className="p-10 space-y-10 shadow-premium">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-accent rounded-full shadow-glow-accent" />
              <h3 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.3em]">Operational Cycle</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-tx-primary/[0.03] border border-border-base/60 space-y-2">
                <span className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-40">Node Closing</span>
                <span className="block text-lg font-black text-tx-primary tracking-tight">{balance?.next_closing || '—'}</span>
              </div>
              <div className="p-6 rounded-2xl bg-tx-primary/[0.03] border border-border-base/60 space-y-2">
                <span className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-40">Payment Day</span>
                <span className="block text-lg font-black text-warning tracking-tight drop-shadow-glow-warning">{balance?.next_payment || '—'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <label className="text-[11px] font-black text-tx-secondary uppercase tracking-[0.2em]">Liability Usage Ratio</label>
                <span className={`text-2xl font-black tabular-nums tracking-tighter text-${colorVariant}`}>{pct}%</span>
              </div>
              <div className="h-3 bg-tx-primary/5 rounded-full overflow-hidden p-[2px]">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-glow-${colorVariant}`}
                  style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} 
                />
              </div>
            </div>

            <Button onClick={syncNow} variant="ghost" className="w-full py-7 font-black tracking-[0.2em] uppercase text-[11px] gap-3 border border-border-base/40">
              <span className="text-lg animate-spin-slow">🔄</span> Sync Delta Flows
            </Button>
          </Card>
        </div>

        {/* TRANSACTIONS LIST */}
        <Card className="flex flex-col min-h-[640px] overflow-hidden shadow-premium">
          <div className="p-8 border-b border-border-base flex items-center justify-between bg-tx-primary/[0.01]">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-glow-accent" />
              <h3 className="text-sm font-black text-tx-primary uppercase tracking-[0.3em]">Passive Transactions Ledger</h3>
            </div>
            <Badge variant="muted" className="tracking-widest font-black uppercase text-[10px]">
              {balance?.transactions?.length || 0} DETECTED ENTRIES
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {balance?.transactions?.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] font-black uppercase text-tx-muted/30 tracking-[0.3em] border-b border-border-base bg-tx-primary/[0.02]">
                    <th className="p-7 px-10">Concept / Descriptor</th>
                    <th className="p-7">Timestamp</th>
                    <th className="p-7 text-right pr-12">Delta Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {balance.transactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-tx-primary/[0.01] transition-colors group">
                      <td className="p-7 px-10">
                        <div className="text-sm font-black text-tx-primary group-hover:text-tx-primary transition-colors uppercase tracking-tight leading-tight">{tx.name}</div>
                        <div className="text-[8px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-30 mt-2">TXN_{i+1024} // VECTOR_FEED</div>
                      </td>
                      <td className="p-7">
                        <Badge variant="muted" className="font-black px-4 py-1.5 transition-all group-hover:text-accent group-hover:border-accent/30">{tx.date}</Badge>
                      </td>
                      <td className="p-7 text-right pr-12">
                        <span className="text-lg font-black text-warning tabular-nums tracking-tighter drop-shadow-glow-warning">{fmt(tx.subtotal)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-20 grayscale">
                <span className="text-6xl animate-bounce">📦</span>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center max-w-xs leading-loose">No transactional threads detected <br/> in the current window.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* HISTORY */}
      <Card className="overflow-hidden shadow-premium">
        <div className="p-10 border-b border-border-base bg-tx-primary/[0.01] flex items-center gap-4">
          <div className="w-2 h-8 bg-accent rounded-full shadow-glow-accent" />
          <h3 className="text-sm font-black text-tx-primary uppercase tracking-[0.4em]">Sector Analysis: Historical Saturation</h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[9px] font-black uppercase text-tx-muted/30 border-b border-border-base bg-tx-primary/[0.02] tracking-[0.3em]">
                <th className="p-8 px-12">Fiscal Window</th>
                <th className="p-8">Assigned Consumption</th>
                <th className="p-8">Cap Total</th>
                <th className="p-8 text-center w-80">Saturation Vector</th>
                <th className="p-8 text-right pr-12">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {history.map(h => (
                <tr key={h.month} className="hover:bg-tx-primary/[0.01] transition-colors group">
                  <td className="p-8 px-12 font-black text-tx-primary group-hover:text-accent transition-colors tracking-tight uppercase">{h.month}</td>
                  <td className="p-8 font-black tabular-nums text-tx-primary text-xl tracking-tighter">{fmt(h.used)}</td>
                  <td className="p-8 font-bold text-tx-muted opacity-30 tabular-nums">{fmt(h.total_limit)}</td>
                  <td className="p-8">
                    <div className="flex items-center gap-6">
                      <div className="flex-1 h-3 bg-tx-primary/5 rounded-full overflow-hidden p-[2px]">
                        <div 
                          className={`h-full transition-all duration-1000 rounded-full ${h.used_pct > 80 ? 'bg-danger shadow-glow-danger' : 'bg-accent shadow-glow-accent'}`}
                          style={{ width: `${Math.min(h.used_pct, 100)}%` }} 
                        />
                      </div>
                      <span className={`text-sm font-black tabular-nums w-14 text-right ${h.used_pct > 80 ? 'text-danger' : 'text-tx-secondary'}`}>{h.used_pct}%</span>
                    </div>
                  </td>
                  <td className="p-8 text-right pr-12">
                    <Link to={`/registry?month=${h.month}`}>
                      <Button variant="ghost" size="sm" className="font-black text-[10px] tracking-widest px-8 border border-border-base/40">INSPECT</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CONFIG MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-primary/90 backdrop-blur-xl" onClick={() => setIsEditing(false)} />
          <Card className="w-full max-w-2xl p-10 md:p-14 relative z-10 animate-in zoom-in-95 duration-500 rounded-[3rem] shadow-premium">
            <div className="flex flex-col gap-2 mb-12">
              <h2 className="text-3xl font-black text-tx-primary uppercase tracking-tighter leading-none">Node Architecture</h2>
              <Badge variant="accent" className="w-fit tracking-[0.4em] font-black uppercase text-[9px] px-3">SECURITY PROTOCOL VII</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Asset Alias</label>
                <Input value={formCfg.name} onChange={e => setFormCfg({ ...formCfg, name: e.target.value })} placeholder="e.g. Black Priority Card" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Quota Limit ($)</label>
                <Input type="number" value={formCfg.total_limit} onChange={e => setFormCfg({ ...formCfg, total_limit: e.target.value })} className="tabular-nums font-black" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Data Source (Channel)</label>
                <Select value={formCfg.channel_id} onChange={e => setFormCfg({ ...formCfg, channel_id: e.target.value })} options={channelOptions} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Alert Threshold (%)</label>
                <Input type="number" value={formCfg.alert_threshold} onChange={e => setFormCfg({ ...formCfg, alert_threshold: e.target.value })} className="tabular-nums font-black" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Closing Day</label>
                <Input type="number" min="1" max="31" value={formCfg.closing_day} onChange={e => setFormCfg({ ...formCfg, closing_day: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Payment deadline</label>
                <Input type="number" min="1" max="31" value={formCfg.payment_day} onChange={e => setFormCfg({ ...formCfg, payment_day: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 mt-14">
              <Button onClick={saveConfig} variant="accent" className="flex-1 py-7 uppercase tracking-[0.3em] font-black" disabled={saving}>
                {saving ? 'SYNCHRONIZING...' : 'APPLY ARCHITECTURE'}
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="ghost" className="px-12 py-7 uppercase tracking-[0.2em] border border-border-base/60 font-black">
                DISCARD
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
