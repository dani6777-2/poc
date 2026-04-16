import React, { useState, useEffect } from 'react'
import { DashboardTemplate } from '../components/templates'
import { Card, Button, Input, Select, Badge } from '../components/atoms'
import { financeService } from '../services'
import { useToast } from '../context/ToastContext'
import { useFinance } from '../context/FinanceContext'

export default function Settings() {
  const { fetchTaxonomies, sections, categories, channels } = useFinance()
  const { addToast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('sections') // sections | categories | channels

  // Forms
  const [secForm, setSecForm] = useState({ id: null, name: '', icon: '', color_bg: 'bg-primary-soft', color_accent: 'text-primary', sort_order: 0 })
  const [catForm, setCatForm] = useState({ id: null, name: '', section_id: '', sort_order: 0 })
  const [chanForm, setChanForm] = useState({ id: null, name: '' })

  const loadData = async () => {
    setLoading(true)
    await fetchTaxonomies()
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

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
        await financeService.createCategory({ name: catForm.name, section_id: Number(catForm.section_id), sort_order: Number(catForm.sort_order) })
        addToast("Category created", "success")
      }
      setCatForm({ id: null, name: '', section_id: '', sort_order: 0 })
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

  const sectionOptions = sections.map(s => ({ value: s.id, label: `${s.icon} ${s.name}` }))

  return (
    <DashboardTemplate
      title={<>System <span className="text-accent italic font-light">Settings</span></>}
      subtitle="Configure taxonomy domains, structural classes and vectors"
      icon="⚙️"
      loading={loading}
    >
      <div className="flex gap-3 mb-8 glass p-1 w-fit rounded-2xl">
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'sections' ? 'bg-accent text-white shadow-glow-accent' : 'text-tx-secondary hover:bg-tx-primary/10'}`}
        >
          Sections
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-accent text-white shadow-glow-accent' : 'text-tx-secondary hover:bg-tx-primary/10'}`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'channels' ? 'bg-accent text-white shadow-glow-accent' : 'text-tx-secondary hover:bg-tx-primary/10'}`}
        >
          Channels
        </button>
      </div>

      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                            <Button title={sec.tenant_id === null ? "Cannot edit global section" : "Edit section"} variant="ghost" size="sm" disabled={sec.tenant_id === null} onClick={() => setSecForm({ id: sec.id, name: sec.name, icon: sec.icon || '', color_bg: sec.color_bg || '', color_accent: sec.color_accent || '', sort_order: sec.sort_order || 0 })}>✏️</Button>
                            <Button title={sec.tenant_id === null ? "Cannot delete global section" : "Delete section"} variant="ghost" size="sm" disabled={sec.tenant_id === null} onClick={() => handleDeleteSection(sec.id)} className="text-danger hover:text-danger-light disabled:opacity-50 disabled:cursor-not-allowed">🗑️</Button>
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
                <div className="pt-4 flex gap-3">
                  <Button variant="accent" className="flex-1" onClick={handleSaveCategory}>💾 Save</Button>
                  {catForm.id && <Button variant="ghost" onClick={() => setCatForm({ id: null, name: '', section_id: '', sort_order: 0 })}>Cancel</Button>}
                </div>
              </div>
            </Card>
          </div>

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
