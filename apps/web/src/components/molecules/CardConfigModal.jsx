import Card from '../atoms/Card'
import Badge from '../atoms/Badge'
import Button from '../atoms/Button'
import Input from '../atoms/Input'
import Select from '../atoms/Select'

export default function CardConfigModal({
  isEditing,
  onClose,
  formCfg,
  onFormChange,
  channelOptions,
  onSave,
  saving
}) {
  if (!isEditing) return null

  const handleChange = (field, value) => {
    onFormChange({ ...formCfg, [field]: value })
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-primary/90 backdrop-blur-xl" onClick={onClose} />
      <Card className="w-full max-w-2xl p-6 lg:p-10 md:p-5 md:p-8 lg:p-14 relative z-10 animate-in zoom-in-95 duration-500 rounded-[3rem] shadow-premium">
        <div className="flex flex-col gap-2 mb-12">
          <h2 className="text-3xl font-black text-tx-primary uppercase tracking-tighter leading-none">Node Architecture</h2>
          <Badge variant="accent" className="w-fit tracking-[0.4em] font-black uppercase text-[9px] px-3">SECURITY PROTOCOL VII</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:p-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Asset Alias</label>
            <Input value={formCfg.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Black Priority Card" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Quota Limit ($)</label>
            <Input type="number" value={formCfg.total_limit} onChange={e => handleChange('total_limit', e.target.value)} className="tabular-nums font-black" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Data Source (Channel)</label>
            <Select value={formCfg.channel_id} onChange={e => handleChange('channel_id', e.target.value)} options={channelOptions} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Alert Threshold (%)</label>
            <Input type="number" value={formCfg.alert_threshold} onChange={e => handleChange('alert_threshold', e.target.value)} className="tabular-nums font-black" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Closing Day</label>
            <Input type="number" min="1" max="31" value={formCfg.closing_day} onChange={e => handleChange('closing_day', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Payment deadline</label>
            <Input type="number" min="1" max="31" value={formCfg.payment_day} onChange={e => handleChange('payment_day', e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 mt-14">
          <Button onClick={onSave} variant="accent" className="flex-1 py-7 uppercase tracking-[0.3em] font-black" disabled={saving}>
            {saving ? 'SYNCHRONIZING...' : 'APPLY ARCHITECTURE'}
          </Button>
          <Button onClick={onClose} variant="ghost" className="px-12 py-7 uppercase tracking-[0.2em] border border-border-base/60 font-black">
            DISCARD
          </Button>
        </div>
      </Card>
    </div>
  )
}