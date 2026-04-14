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
      addToast('Failure in data persistence', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Confirm de-listing of this asset?')) return
    try {
      await expenseService.deleteInventoryItem('block-a', id)
      addToast('Asset removed from inventory', 'warning')
      fetchData()
    } catch (e) {
      addToast('Error processing deletion', 'error')
    }
  }

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
        fmt={fmt}
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
              fmt={fmt}
              type="block-a"
            />
          ))}

          {items.length === 0 && (
            <Card border={false} className="py-40 flex flex-col items-center justify-center text-center opacity-20 bg-tx-primary/[0.01]">
              <span className="text-6xl mb-6">📦</span>
              <p className="text-xs font-black uppercase tracking-[0.5em]">Block A vault is empty</p>
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
