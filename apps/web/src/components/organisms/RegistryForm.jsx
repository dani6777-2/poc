import React from 'react';
import Card from '../atoms/Card';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import Button from '../atoms/Button';

const RegistryForm = ({ 
  editId, 
  form, 
  setForm, 
  catOptions, 
  canalOptions, 
  unitOptions, 
  STATUS_OPTIONS, 
  handleSubmit, 
  onCancel,
  BLANK_STATE
}) => {
  return (
    <Card className={`p-8 border border-border-base shadow-premium transition-all duration-500 ${editId ? 'glow-accent' : ''}`}>
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-sm font-black text-tx-primary tracking-[0.3em] uppercase">
          {editId ? '✏️ Module Update' : '🚀 Supplies Ingestion'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="md:col-span-2">
          <Input 
            label="Product" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            placeholder="e.g.: Whole Milk" 
          />
        </div>
        <Select 
          label="Category" 
          value={form.category_id} 
          onChange={e => setForm({ ...form, category_id: e.target.value })} 
          options={catOptions} 
        />
        <Select 
          label="Channel" 
          value={form.channel_id} 
          onChange={e => setForm({ ...form, channel_id: e.target.value })} 
          options={canalOptions} 
        />
        <div className="grid grid-cols-2 gap-2">
          <Input 
            label="Quantity" 
            type="number" 
            step="0.1" 
            value={form.quantity} 
            onChange={e => setForm({ ...form, quantity: e.target.value })} 
          />
          <Select 
            label="Unit" 
            value={form.unit_id} 
            onChange={e => setForm({ ...form, unit_id: e.target.value })} 
            options={unitOptions} 
          />
        </div>
        <Input 
          label="Unit Price ($)" 
          type="number" 
          value={form.unit_price} 
          onChange={e => setForm({ ...form, unit_price: e.target.value })} 
          className="text-success font-black" 
        />
        <Select 
          label="Status" 
          value={form.status} 
          onChange={e => setForm({ ...form, status: e.target.value })} 
          options={STATUS_OPTIONS} 
        />

        <div className="md:col-span-6 mt-4">
          <Button className="w-full py-5" onClick={handleSubmit}>
            {editId ? 'Confirm Changes' : 'Enter into Record'}
          </Button>
          {editId && (
            <Button 
              variant="ghost" 
              className="w-full mt-2" 
              onClick={onCancel}
            >
              Cancel Edit
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RegistryForm;
