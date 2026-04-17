import React, { useState, useEffect } from 'react'
import { DashboardTemplate } from '../components/templates'
import { useFinance } from '../context/FinanceContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { tenantService } from '../services/tenant.service'
import { financeService } from '../services/finance.service'
import { expenseService } from '../services/expense.service'
import { Card, Button, Input, Select, Badge } from '../components/atoms'

export default function Settings() {
  const { fetchTaxonomies, sections, categories, channels } = useFinance()
  const { addToast } = useToast()
  const { activeTenant } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [annualRows, setAnnualRows] = useState([])
  const [activeTab, setActiveTab] = useState('invites') // invites | sections | categories | channels
  const [inviteCode, setInviteCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [members, setMembers] = useState([])
  const isGuest = activeTenant?.role === 'guest'

  // Forms
  const [secForm, setSecForm] = useState({ id: null, name: '', icon: '', color_bg: 'bg-primary-soft', color_accent: 'text-primary', sort_order: 0 })
  const [catForm, setCatForm] = useState({ id: null, name: '', section_id: '', sort_order: 0, sync_annual: true })
  const [chanForm, setChanForm] = useState({ id: null, name: '' })

  const loadData = async () => {
    setLoading(true)
    await fetchTaxonomies()
    try {
      const currentYear = new Date().getFullYear()
      const annualData = await expenseService.getAnnualExpenses(currentYear)
      setAnnualRows(annualData)
    } catch (e) {}
    setLoading(false)
  }

  const loadInviteCode = async () => {
    if (activeTenant?.role !== 'owner') return
    try {
      const data = await tenantService.getInviteCode()
      setInviteCode(data.invite_code)
    } catch (e) {}
  }

  const loadMembers = async () => {
    if (activeTenant?.role !== 'owner') return
    try {
      const data = await tenantService.getMembers()
      setMembers(data)
    } catch (e) {}
  }

  useEffect(() => {
    loadData()
    loadInviteCode()
    loadMembers()
  }, [activeTenant])

  // --- Sections CRUD ---
  const handleSaveSection = async () => {
    if (!secForm.name) return addToast("Name required", "warning")
    try {
      setLoading(true)
      const payload = {
        name: secForm.name,
        icon: secForm.icon || '📌',
        color_bg: secForm.color_bg || 'bg-slate-soft',
        color_accent: secForm.color_accent || 'text-slate',
        sort_order: Number(secForm.sort_order) || 0
      }
      if (secForm.id) {
        await financeService.updateSection(secForm.id, payload)
        addToast("Section updated", "success")
      } else {
        await financeService.createSection(payload)
        addToast("Section created", "success")
      }
      setSecForm({ id: null, name: '', icon: '', color_bg: 'bg-primary-soft', color_accent: 'text-primary', sort_order: 0 })
      await loadData()
    } catch (e) {
      addToast(e.response?.data?.detail || "Error saving section", "danger")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSection = async (id) => {
    if (!confirm("Delete section?")) return
    try {
      setLoading(true)
      await financeService.deleteSection(id)
      addToast("Section deleted", "success")
      await loadData()
    } catch (e) {
      addToast(e.response?.data?.detail || "Error deleting section", "danger")
    } finally {
      setLoading(false)
    }
  }

  // --- Categories CRUD ---
  const handleSaveCategory = async () => {
    if (!catForm.name || !catForm.section_id) return addToast("Name/Section required", "warning")
    try {
      setLoading(true)
      if (catForm.id) {
        await financeService.updateCategory(catForm.id, { name: catForm.name, section_id: Number(catForm.section_id), sort_order: Number(catForm.sort_order) })
        addToast("Category updated", "success")
      } else {
        const category = await financeService.createCategory({ name: catForm.name, section_id: Number(catForm.section_id), sort_order: Number(catForm.sort_order) })
        
        // --- Automatically inject annual concept if requested ---
        if (catForm.sync_annual) {
          const currentYear = new Date().getFullYear()
          try {
            await expenseService.createExpenseDetail({
              year: currentYear,
              section_id: Number(catForm.section_id),
              category_id: category.id,
              description: `📦 ${catForm.name}`,
              sort_order: 99
            })
            addToast("Annual budget row initialized", "info")
          } catch (err) {
            console.error("Auto-sync failed:", err)
          }
        }
        
        addToast("Category created", "success")
      }
      setCatForm({ id: null, name: '', section_id: '', sort_order: 0, sync_annual: true })
      await loadData()
    } catch (e) {
      addToast(e.response?.data?.detail || "Error saving category", "danger")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm("Delete category?")) return
    try {
      setLoading(true)
      await financeService.deleteCategory(id)
      addToast("Category deleted", "success")
      await loadData()
    } catch (e) {
      addToast(e.response?.data?.detail || "Error deleting category", "danger")
    } finally {
      setLoading(false)
    }
  }

  // --- Channels CRUD ---
  const handleSaveChannel = async () => {
    if (!chanForm.name) return addToast("Name required", "warning")
    try {
      setLoading(true)
      if (chanForm.id) {
        await financeService.updateChannel(chanForm.id, { name: chanForm.name })
        addToast("Channel updated", "success")
      } else {
        await financeService.createChannel({ name: chanForm.name })
        addToast("Channel created", "success")
      }
      setChanForm({ id: null, name: '' })
      await loadData()
    } catch (e) {
      addToast(e.response?.data?.detail || "Error saving channel", "danger")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChannel = async (id) => {
    if (!confirm("Delete channel?")) return
    try {
      setLoading(true)
      await financeService.deleteChannel(id)
      addToast("Channel deleted", "success")
      await loadData()
    } catch (e) {
      addToast(e.response?.data?.detail || "Error deleting channel", "danger")
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode) return addToast("Enter a code", "warning")
    try {
      setLoading(true)
      await tenantService.joinTenant(joinCode)
      addToast("Successfully joined home!", "success")
      setJoinCode('')
    } catch (e) {
      addToast(e.message || "Invalid code", "danger")
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshCode = async () => {
    try {
      setLoading(true)
      const data = await tenantService.getInviteCode()
      setInviteCode(data.invite_code)
      addToast("Invite code sequence updated", "success")
    } catch (e) {
      addToast("Failed to refresh code", "danger")
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (userId) => {
    if (!confirm("Are you sure you want to revoke access?")) return
    try {
      setLoading(true)
      await tenantService.revokeAccess(userId)
      addToast("Access revoked", "success")
      await loadMembers()
    } catch (e) {
      addToast("Failed to revoke access", "danger")
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this household? You will lose access immediately.")) return
    try {
      setLoading(true)
      await tenantService.leaveHome()
      addToast("You have left the household", "success")
      window.location.href = "/" // Hard redirect to reset context/session
    } catch (e) {
      addToast("Failed to leave home", "danger")
    } finally {
      setLoading(false)
    }
  }

  const sectionOptions = sections.map(s => ({ value: s.id, label: `${s.icon} ${s.name}` }))

  return (
    <DashboardTemplate
      title={<>System <span className="text-accent italic font-light">Settings</span></>}
      subtitle="Configure taxonomy domains, structural classes and vectors"
      icon="⚙️"
      loading={loading}
    >
      <div className="flex gap-3 mb-8 glass p-1 w-fit rounded-2xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('invites')}
          className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'invites' ? 'bg-accent text-white shadow-glow-accent' : 'text-tx-secondary hover:bg-tx-primary/10'}`}
        >
          🤝 Invites
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'sections' ? 'bg-accent text-white shadow-glow-accent' : 'text-tx-secondary hover:bg-tx-primary/10'}`}
        >
          Sections
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-accent text-white shadow-glow-accent' : 'text-tx-secondary hover:bg-tx-primary/10'}`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'channels' ? 'bg-accent text-white shadow-glow-accent' : 'text-tx-secondary hover:bg-tx-primary/10'}`}
        >
          Channels
        </button>
      </div>

      {activeTab === 'invites' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <Card className="p-8 border-none shadow-premium bg-tx-primary/[0.02] flex flex-col justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center text-3xl mx-auto mb-6">🔑</div>
            <h3 className="text-xl font-black tracking-tighter mb-2">My <span className="text-accent italic font-light">Access Code</span></h3>
            <p className="text-[10px] font-bold text-tx-muted uppercase tracking-[0.2em] mb-8 opacity-60">Share this code to let others view this home</p>
            
            {activeTenant?.role === 'owner' ? (
              <div className="space-y-6">
                <div className="bg-secondary/50 border border-accent/20 rounded-3xl p-6 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-4xl font-black text-accent tracking-[0.3em] font-mono selection:bg-accent selection:text-white">
                    {inviteCode || '••••••••'}
                  </div>
                </div>
                <Button variant="ghost" className="uppercase font-black text-[10px] tracking-widest" onClick={handleRefreshCode}>
                  🔄 Regerate Code
                </Button>
              </div>
            ) : (
                <div className="p-10 glass rounded-3xl border-danger/20">
                    <p className="text-danger font-black text-xs uppercase tracking-widest">Administrative Lock</p>
                    <p className="text-[10px] text-tx-muted mt-2">Only the home owner can generate invitation codes.</p>
                </div>
            )}
          </Card>

          <Card className="p-8 border-none shadow-premium bg-tx-primary/[0.02] flex flex-col justify-center text-center">
             <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center text-3xl mx-auto mb-6">🤝</div>
            <h3 className="text-xl font-black tracking-tighter mb-2">Join <span className="text-success italic font-light">Existing Home</span></h3>
            <p className="text-[10px] font-bold text-tx-muted uppercase tracking-[0.2em] mb-8 opacity-60">Enter a secret code shared by a friend</p>
            
            <div className="space-y-4 max-w-xs mx-auto w-full">
              <Input 
                className="text-center text-lg font-black tracking-widest uppercase h-14" 
                placeholder="PROMO-CODE-X"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
              />
              <Button variant="accent" className="w-full h-14 shadow-glow-accent" onClick={handleJoin} disabled={!joinCode}>
                JOIN HOME
              </Button>
            </div>
          </Card>

          {activeTenant?.role === 'owner' && (
            <Card className="p-8 border-none shadow-premium bg-tx-primary/[0.02] lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black tracking-tighter">Household <span className="text-accent italic font-light">Members</span></h3>
                  <p className="text-[10px] font-bold text-tx-muted uppercase tracking-[0.2em] opacity-60">Manage permissions and access vectors</p>
                </div>
                <Badge variant="accent" glow>{members.length} Active</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.filter(m => m.user_id !== activeTenant.user_id).map(member => (
                  <div key={member.user_id} className="p-4 rounded-2xl bg-secondary/50 border border-border-base/40 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-tx-primary">{member.email}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-tx-muted opacity-40">{member.role}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => handleRevoke(member.user_id)}>
                      Revoke
                    </Button>
                  </div>
                ))}
                {members.length <= 1 && (
                  <div className="md:col-span-2 py-10 text-center glass rounded-2xl border-dashed border-border-base">
                    <p className="text-[10px] font-black uppercase tracking-widest text-tx-muted opacity-40 italic">No secondary members connected</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {isGuest && (
             <Card className="p-8 border-none shadow-premium bg-danger/5 border border-danger/20 flex flex-col justify-center text-center lg:col-span-2">
                <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center text-3xl mx-auto mb-6">🚪</div>
                <h3 className="text-xl font-black tracking-tighter mb-2">Leave <span className="text-danger italic font-light">Household</span></h3>
                <p className="text-[10px] font-bold text-tx-muted uppercase tracking-[0.2em] mb-8 opacity-60">Disconnect from {activeTenant.name}. You will need a new invite to return.</p>
                <div className="max-w-xs mx-auto w-full">
                  <Button variant="danger" className="w-full h-14 shadow-glow-danger" onClick={handleLeave}>
                    CONFIRM EXIT
                  </Button>
                </div>
             </Card>
          )}
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {!isGuest && (
            <div className="lg:col-span-1">
              <Card className="p-8 border-none shadow-premium bg-tx-primary/[0.02]">
                <h3 className="text-lg font-black uppercase tracking-widest mb-6">
                  {secForm.id ? 'Edit Section' : 'New Section'}
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] mb-2 block">Name</label>
                    <Input value={secForm.name} onChange={e => setSecForm({ ...secForm, name: e.target.value })} placeholder="e.g. Food..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] mb-2 block">Icon (Emoji)</label>
                    <Input value={secForm.icon} onChange={e => setSecForm({ ...secForm, icon: e.target.value })} placeholder="e.g. 🍽️" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] mb-2 block">Sort Order</label>
                    <Input type="number" value={secForm.sort_order} onChange={e => setSecForm({ ...secForm, sort_order: e.target.value })} />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button variant="accent" className="flex-1" onClick={handleSaveSection}>💾 Save</Button>
                    {secForm.id && <Button variant="ghost" onClick={() => setSecForm({ id: null, name: '', icon: '', color_bg: 'bg-primary-soft', color_accent: 'text-primary', sort_order: 0 })}>Cancel</Button>}
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-none shadow-premium">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-base/50 text-[10px] font-black text-tx-muted uppercase tracking-[0.3em]">
                      <th className="p-5">Icon</th>
                      <th className="p-5">Name</th>
                      <th className="p-5">Scope</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base/30">
                    {sections.map(sec => (
                      <tr key={sec.id} className="hover:bg-tx-primary/[0.02] transition-colors group">
                        <td className="p-5 text-xl">{sec.icon}</td>
                        <td className="p-5 font-bold">{sec.name}</td>
                        <td className="p-5">
                          {sec.tenant_id === null ? (
                            <Badge variant="warning" size="sm">Global</Badge>
                          ) : (
                            <Badge variant="success" size="sm">Custom</Badge>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-2">
                            <Button title={isGuest ? "Read-Only Mode" : (sec.tenant_id === null ? "Cannot edit global section" : "Edit section")} variant="ghost" size="sm" disabled={isGuest || sec.tenant_id === null} onClick={() => setSecForm({ id: sec.id, name: sec.name, icon: sec.icon || '', color_bg: sec.color_bg || '', color_accent: sec.color_accent || '', sort_order: sec.sort_order || 0 })}>✏️</Button>
                            <Button title={isGuest ? "Read-Only Mode" : (sec.tenant_id === null ? "Cannot delete global section" : "Delete section")} variant="ghost" size="sm" disabled={isGuest || sec.tenant_id === null} onClick={() => handleDeleteSection(sec.id)} className="text-danger hover:text-danger-light disabled:opacity-50 disabled:cursor-not-allowed">🗑️</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {!isGuest && (
            <div className="lg:col-span-1">
              <Card className="p-8 border-none shadow-premium bg-tx-primary/[0.02]">
                <h3 className="text-lg font-black uppercase tracking-widest mb-6">
                  {catForm.id ? 'Edit Category' : 'New Category'}
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] mb-2 block">Name</label>
                    <Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Groceries..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] mb-2 block">Section</label>
                    <Select 
                      value={catForm.section_id} 
                      onChange={e => setCatForm({ ...catForm, section_id: e.target.value })} 
                      options={[{value:'', label:'- Select Section -'}, ...sectionOptions]} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] mb-2 block">Sort Order</label>
                    <Input type="number" value={catForm.sort_order} onChange={e => setCatForm({ ...catForm, sort_order: e.target.value })} />
                  </div>
                  {!catForm.id && (
                    <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                      <input 
                        type="checkbox" 
                        id="sync_annual" 
                        checked={catForm.sync_annual} 
                        onChange={e => setCatForm({...catForm, sync_annual: e.target.checked})}
                        className="w-5 h-5 accent-accent"
                      />
                      <label htmlFor="sync_annual" className="text-[10px] font-black text-accent uppercase tracking-widest cursor-pointer select-none">
                        📌 Sync with Annual Planner
                      </label>
                    </div>
                  )}
                  <div className="pt-4 flex gap-3">
                    <Button variant="accent" className="flex-1" onClick={handleSaveCategory}>💾 Save</Button>
                    {catForm.id && <Button variant="ghost" onClick={() => setCatForm({ id: null, name: '', section_id: '', sort_order: 0 })}>Cancel</Button>}
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-none shadow-premium">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-base/50 text-[10px] font-black text-tx-muted uppercase tracking-[0.3em]">
                      <th className="p-5">Name</th>
                      <th className="p-5">Section</th>
                      <th className="p-5">Scope</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base/30">
                    {categories.map(cat => {
                      const sec = sections.find(s => s.id === cat.section_id)
                      return (
                        <tr key={cat.id} className="hover:bg-tx-primary/[0.02] transition-colors group">
                          <td className="p-5 font-bold">{cat.name}</td>
                          <td className="p-5">
                            {sec ? <Badge variant="secondary" size="sm">{sec.icon} {sec.name}</Badge> : '—'}
                          </td>
                          <td className="p-5">
                            {cat.tenant_id === null ? (
                              <Badge variant="warning" size="sm">Global</Badge>
                            ) : (
                              <Badge variant="success" size="sm">Custom</Badge>
                            )}
                          </td>
                          <td className="p-5">
                            {(() => {
                              const isLinked = annualRows.some(r => r.category_id === cat.id);
                              return isLinked ? (
                                <Badge variant="accent" size="sm" glow>SYNCED</Badge>
                              ) : (
                                <Badge variant="info" size="sm" className="opacity-40">READY</Badge>
                              );
                            })()}
                          </td>
                          <td className="p-5 text-right">
                              <div className="flex justify-end gap-2">
                                <Button title={cat.tenant_id === null ? "Cannot edit global category" : "Edit category"} variant="ghost" size="sm" disabled={cat.tenant_id === null} onClick={() => setCatForm({ id: cat.id, name: cat.name, section_id: cat.section_id, sort_order: cat.sort_order || 0 })}>✏️</Button>
                                <Button title={cat.tenant_id === null ? "Cannot delete global category" : "Delete category"} variant="ghost" size="sm" disabled={cat.tenant_id === null} onClick={() => handleDeleteCategory(cat.id)} className="text-danger hover:text-danger-light disabled:opacity-50 disabled:cursor-not-allowed">🗑️</Button>
                              </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {!isGuest && (
            <div className="lg:col-span-1">
              <Card className="p-8 border-none shadow-premium bg-tx-primary/[0.02]">
                <h3 className="text-lg font-black uppercase tracking-widest mb-6">
                  {chanForm.id ? 'Edit Channel' : 'New Channel'}
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] mb-2 block">Name</label>
                    <Input value={chanForm.name} onChange={e => setChanForm({ ...chanForm, name: e.target.value })} placeholder="e.g. Amazon, Credit..." />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button variant="accent" className="flex-1" onClick={handleSaveChannel}>💾 Save</Button>
                    {chanForm.id && <Button variant="ghost" onClick={() => setChanForm({ id: null, name: '' })}>Cancel</Button>}
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-none shadow-premium">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-base/50 text-[10px] font-black text-tx-muted uppercase tracking-[0.3em]">
                      <th className="p-5">Name</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base/30">
                    {channels.map(ch => (
                      <tr key={ch.id} className="hover:bg-tx-primary/[0.02] transition-colors group">
                        <td className="p-5 font-bold">{ch.name}</td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-2">
                            <Button title={ch.tenant_id === null ? "Cannot edit global channel" : "Edit channel"} variant="ghost" size="sm" disabled={ch.tenant_id === null} onClick={() => setChanForm({ id: ch.id, name: ch.name })}>✏️</Button>
                            <Button title={ch.tenant_id === null ? "Cannot delete global channel" : "Delete channel"} variant="ghost" size="sm" disabled={ch.tenant_id === null} onClick={() => handleDeleteChannel(ch.id)} className="text-danger hover:text-danger-light disabled:opacity-50 disabled:cursor-not-allowed">🗑️</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </DashboardTemplate>
  )
}
