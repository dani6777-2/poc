import { useState, useEffect, useCallback, useMemo } from 'react'
import { expenseService } from '../services'
import { RECENT_MONTHS } from '../constants/time'
import { INVENTORY_BLOCK_A_DEFAULT } from '../constants/forms'
import { fmt } from '../utils/formatters'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../context/ToastContext'

// Atoms & Molecules
import { DashboardTemplate } from '../components/templates'
import Card from '../components/atoms/Card'
import Button from '../components/atoms/Button'
import InventorySummaryCard from '../components/molecules/InventorySummaryCard'

// Organisms
import InventorySection from '../components/organisms/InventorySection'
import InventoryEditorModal from '../components/organisms/InventoryEditorModal'

export default function BlockA() {
  const { sections, categories, channels, units } = useFinance()
  const [month, setMonth] = useState(RECENT_MONTHS[0])
  const [items, setItems] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(INVENTORY_BLOCK_A_DEFAULT(RECENT_MONTHS[0], ''))
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await expenseService.getInventoryBlock('block-a', { month })
      setItems(data)
    } catch (e) {
      addToast('Error connecting to inventory vault', 'error')
    } finally {
      setLoading(false)
    }
  }, [month, addToast])

  useEffect(() => { fetchData() }, [fetchData])

  const openNew = (catId = null) => {
    const defaultCatId = catId || categories[0]?.id || ''
    setForm(INVENTORY_BLOCK_A_DEFAULT(month, defaultCatId))
    setEditing(null)
    setModal(true)
  }

  const openEdit = (item) => {
    setForm({ ...item })
    setEditing(item.id)
    setModal(true)
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const payload = {
      ...form,
      category_id: parseInt(form.category_id),
      unit_id: parseInt(form.unit_id) || null,
      channel_id: parseInt(form.channel_id) || null,
      quantity: parseFloat(form.quantity) || 0,
      unit_price: parseFloat(form.unit_price) || 0,
      prev_month_price: form.prev_month_price ? parseFloat(form.prev_month_price) : null
    }

    try {
      if (editing) {
        await expenseService.updateInventoryItem('block-a', editing, payload)
        addToast('Registry updated in the matrix', 'success')
      } else {
        await expenseService.createInventoryItem('block-a', payload)
        addToast('New asset registered in Block A', 'success')
      }
      setModal(false)
      fetchData()
    } catch (e) {
      if (e.status === 409) {
        addToast('⚠️ CONFLICT: Vault was updated by someone else. Synchronizing...', 'warning')
      } else {
        addToast('Failure in data persistence', 'error')
      }
    } finally {
      fetchData()
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Confirm de-listing of this asset?')) return
    try {
      await expenseService.deleteInventoryItem('block-a', id)
      addToast('Asset removed from inventory', 'warning')
      fetchData()
    } catch (e) {
      if (e.status === 409) {
        addToast('⚠️ CONFLICT: Registry was modified externally.', 'warning')
      } else {
        addToast('Error processing deletion', 'error')
      }
    } finally {
      fetchData()
    }
  }

  const handleToggleStatus = useCallback(async (item) => {
    const newStatus = item.status === 'Bought' ? 'Planned' : 'Bought'
    try {
      await expenseService.updateInventoryItem('block-a', item.id, {
        ...item,
        status: newStatus
      })
      addToast(`Item marked as ${newStatus}`, 'success')
      fetchData()
    } catch (e) {
      if (e.status === 409) {
        addToast('⚠️ CONFLICT: State out of sync.', 'warning')
      } else {
        addToast('Failed to update status', 'error')
      }
    } finally {
      fetchData()
    }
  }, [fetchData, addToast])

  const subtotalValue = useMemo(() =>
    (parseFloat(form.quantity) || 0) * (parseFloat(form.unit_price) || 0),
    [form.quantity, form.unit_price]
  )

  const totalGeneral = useMemo(() =>
    items.reduce((s, i) => s + (i.subtotal || 0), 0),
    [items]
  )

  const sectionsWithItems = useMemo(() => {
    const groups = {}
    items.forEach(item => {
      const secName = item.section_name || 'Various'
      if (!groups[secName]) groups[secName] = []
      groups[secName].push(item)
    })
    return groups
  }, [items])

  const sortedSecNames = useMemo(() => {
    const names = Object.keys(sectionsWithItems)
    return names.sort((a, b) => {
      const sa = sections.find(s => s.name === a)?.sort_order || 99
      const sb = sections.find(s => s.name === b)?.sort_order || 99
      return sa - sb
    })
  }, [sectionsWithItems, sections])

  const catOptions = useMemo(() => categories.map(c => ({ value: c.id, label: c.name })), [categories])
  const canalOptions = useMemo(() => channels.map(c => ({ value: c.id, label: c.name })), [channels])
  const unitOptions = useMemo(() => units.map(u => ({ value: u.id, label: u.name })), [units])

  return (
    <DashboardTemplate
      title={<>Inventory <span className="text-accent italic font-light">Block A</span></>}
      subtitle="Critical management of pantry, groceries, and mass consumption stock"
      icon="🏪"
      badge={`Master Inventory ${month} Active`}
      loading={loading}
      loadingText="Synchronizing Block A vaults..."
      headerAction={
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
          <Button onClick={() => openNew()} variant="accent" size="sm" className="px-6 font-black uppercase tracking-widest h-11">
            + Add Asset
          </Button>
        </div>
      }
    >

      <InventorySummaryCard
        totalValue={totalGeneral}
        itemCount={items.length}
        items={items}
        fmt={fmt}
        performanceLabel="Shopping Progress"
      />

        <div className="space-y-16">
          {sortedSecNames.map(secName => (
            <InventorySection
              key={secName}
              secName={secName}
              secTotal={sectionsWithItems[secName].reduce((s, i) => s + (i.subtotal || 0), 0)}
              secItems={sectionsWithItems[secName]}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              fmt={fmt}
              type="block-a"
            />
          ))}

          {items.length === 0 && (
            <Card border={false} className="py-32 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-tx-primary/[0.02] backdrop-blur-[2px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 glass rounded-3xl flex items-center justify-center text-5xl mb-8 shadow-2xl animate-float group-hover:scale-110 transition-transform duration-700">
                  📦
                </div>
                <h4 className="text-sm font-black text-tx-primary uppercase tracking-[0.4em] mb-3 opacity-80">
                  Block A Vault <span className="text-accent">Offline</span>
                </h4>
                <p className="max-w-xs text-[10px] font-bold text-tx-muted uppercase tracking-widest leading-relaxed opacity-40 mb-10">
                  The inventory matrix currently contains no active data vectors for this period. 
                  Initialize the vault to start tracking assets.
                </p>
                <Button 
                  onClick={() => openNew()} 
                  variant="accent" 
                  className="px-10 py-4 h-auto text-[10px] font-black uppercase tracking-[0.3em] shadow-glow-accent group-hover:scale-105 transition-all"
                >
                  + Initialize Matrix
                </Button>
              </div>

              {/* Decorative nodes */}
              <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-accent/20 animate-pulse" />
              <div className="absolute bottom-10 right-10 w-2 h-2 rounded-full bg-accent/20 animate-pulse delay-700" />
            </Card>
          )}
        </div>

      <InventoryEditorModal
        modal={modal}
        setModal={setModal}
        editing={editing}
        form={form}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        catOptions={catOptions}
        canalOptions={canalOptions}
        unitOptions={unitOptions}
        subtotalValue={subtotalValue}
        fmt={fmt}
        type="block-a"
      />
    </DashboardTemplate>
  )
}
