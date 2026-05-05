import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Select } from '../atoms';
import { STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, SECTION_DESPENSA, SECTION_SERVICIOS } from '../../constants/forms';

const RegistryForm = ({
  editId,
  form,
  setForm,
  formType,           // 'despensa' | 'servicios' (deprecated, use sectionSelector)
  setFormType,
  sections,           // from FinanceContext
  categories,         // all categories (filtered inside here by section)
  channels,
  units,
  handleSave,
  onCancel,
  processing,
  duplicateWarning,
  setDuplicateWarning
}) => {
  const { activeTenant } = useAuth();
  const isGuest = activeTenant?.role === 'guest';
  if (isGuest) return null;

  // Internal state for dynamic section selection
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  
  // Initialize selected section based on formType or current category
  useEffect(() => {
    if (selectedSectionId) return;
    
    // Try to find section from current category
    if (form.category_id) {
      const currentCat = (categories || []).find(c => c.id === Number(form.category_id));
      if (currentCat) {
        setSelectedSectionId(currentCat.section_id);
        return;
      }
    }
    
    // Fallback to default based on formType
    const targetSectionName = formType === 'servicios' ? SECTION_SERVICIOS : SECTION_DESPENSA;
    const targetSection = (sections || []).find(s => s.name === targetSectionName);
    if (targetSection) {
      setSelectedSectionId(targetSection.id);
    }
  }, [sections, categories, form.category_id, formType]);
  
  // Update default category when section changes
  useEffect(() => {
    if (!selectedSectionId || isEditing) return;
    
    const defaultCat = (categories || []).find(c => c.section_id === selectedSectionId);
    if (defaultCat && defaultCat.id !== form.category_id) {
      setForm(prev => ({ ...prev, category_id: defaultCat.id }));
    }
  }, [selectedSectionId]);
  
  // Section options
  const sectionOptions = (sections || []).map(s => ({ value: s.id, label: `${s.icon} ${s.name}` }));
  
  // Filter categories by selected section
  const filteredCategories = (categories || []).filter(cat => cat.section_id === selectedSectionId);
  
  // Get current section for display
  const currentSection = (sections || []).find(s => s.id === selectedSectionId);

  // Determine display mode
  const isEditing   = !!editId;

  const handleSectionChange = (sectionId) => {
    const newSectionId = Number(sectionId);
    setSelectedSectionId(newSectionId);
    
    // Also update formType for backwards compatibility
    const newSection = (sections || []).find(s => s.id === newSectionId);
    if (newSection) {
      if (newSection.name === SECTION_SERVICIOS) {
        setFormType?.('servicios');
      } else {
        setFormType?.('despensa');
      }
    }
  };

  return (
    <Card className={`p-5 md:p-8 border border-border-base shadow-premium transition-all duration-500 ${isEditing ? 'border-accent/60 shadow-accent/10' : ''}`}>

      {/* Header & Dynamic Section Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-sm font-black text-tx-primary tracking-[0.25em] uppercase">
            {isEditing ? '✏️ Editar Registro' : currentSection ? `${currentSection.icon} ${currentSection.name}` : '➕ Nuevo Registro'}
          </h3>
          <p className="text-[10px] text-tx-muted mt-1 font-bold uppercase tracking-widest opacity-50">
            {isEditing
              ? 'Modificando entrada existente'
              : filteredCategories.length > 0
                ? `${filteredCategories.length} categorías disponibles`
                : 'Selecciona una sección'}
          </p>
        </div>

        {/* Section selector dropdown — disabled if editing */}
        {!isEditing && (
          <div className="flex items-center gap-2">
            <Select
              value={selectedSectionId || ''}
              onChange={e => handleSectionChange(e.target.value)}
              options={[{value: '', label: '- Seleccionar Sección -'}, ...sectionOptions]}
              className="min-w-[200px]"
            />
          </div>
        )}
      </div>

      {/* Payment method hint */}
      <div className={`mb-6 p-3 rounded-xl flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider ${
        form.payment_method === 'credit'
          ? 'bg-warning/10 text-warning border border-warning/20'
          : 'bg-success/10 text-success border border-success/20'
      }`}>
        {form.payment_method === 'credit'
          ? '💳 Tarjeta de Crédito — Se acumulará como deuda. No descuenta del saldo inmediato.'
          : '💵 Efectivo — Descuenta directamente del saldo disponible.'}
      </div>

      {duplicateWarning && (
        <div className="mb-6 p-4 rounded-xl flex flex-col gap-2 bg-danger/10 text-danger border border-danger/20 animate-in slide-in-from-top-2">
          <div className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <span>⚠️</span> Posible Duplicado
          </div>
          <div className="text-[10px] font-bold opacity-80 leading-relaxed uppercase tracking-widest">
            Ya has registrado exactamente la misma cantidad para esta categoría en este día.
            Si es un gasto legítimo separado, puedes forzar el guardado.
          </div>
        </div>
      )}

      {/* === DYNAMIC FORM (based on selected section) === */}
      {selectedSectionId && !isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Input
            label="Producto / Servicio"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Leche, Factura Luz…"
            className="md:col-span-2"
          />
          <Select
            label="Categoría"
            value={form.category_id}
            onChange={e => setForm({ ...form, category_id: e.target.value })}
            options={filteredCategories.map(c => ({ value: c.id, label: c.name }))}
          />
          <Input
            label={currentSection?.name === SECTION_SERVICIOS ? "Fecha de Vencimiento" : "Fecha"}
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
          />
          <Select
            label="Medio de Pago"
            value={form.payment_method}
            onChange={e => setForm({ ...form, payment_method: e.target.value })}
            options={PAYMENT_METHOD_OPTIONS}
          />
          
          {/* Show quantity/units only for despensa sections */}
          {currentSection?.name === SECTION_DESPENSA ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Cantidad"
                  type="number"
                  step="0.1"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                />
                <Select
                  label="Unidad"
                  value={form.unit_id}
                  onChange={e => setForm({ ...form, unit_id: e.target.value })}
                  options={(units || []).map(u => ({ value: u.id, label: u.name }))}
                />
              </div>
              <Input
                label="Precio Unitario ($)"
                type="number"
                step="0.01"
                value={form.unit_price}
                onChange={e => setForm({ ...form, unit_price: e.target.value })}
                className="text-success font-black"
              />
            </>
          ) : (
            <Input
              label="Monto Total ($)"
              type="number"
              step="0.01"
              value={form.unit_price}
              onChange={e => setForm({ ...form, unit_price: e.target.value })}
              className="text-accent font-black"
            />
          )}

          <div className="md:col-span-2 mt-4 flex gap-3">
            {duplicateWarning ? (
              <Button 
                className="flex-1 py-5 shadow-2xl bg-danger hover:bg-danger-light" 
                onClick={(e) => handleSave(e, true)} 
                disabled={processing}
              >
                ⚠️ Confirmar Duplicado
              </Button>
            ) : (
              <Button className="flex-1 py-5 shadow-2xl" onClick={(e) => handleSave(e)} disabled={processing}>
                {isEditing ? '✓ Confirmar Cambios' : '+ Registrar'}
              </Button>
            )}
            {isEditing && (
              <Button variant="ghost" className="px-8" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Editing mode - show unified form */}
      {isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Input
            label="Producto / Servicio"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Leche, Factura Luz…"
            className="md:col-span-2"
          />
          <Select
            label="Categoría"
            value={form.category_id}
            onChange={e => setForm({ ...form, category_id: e.target.value })}
            options={filteredCategories.length ? filteredCategories : categories.map(c => ({ value: c.id, label: c.name }))}
          />
          <Input
            label="Fecha"
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
          />
          <Select
            label="Medio de Pago"
            value={form.payment_method}
            onChange={e => setForm({ ...form, payment_method: e.target.value })}
            options={PAYMENT_METHOD_OPTIONS}
          />
          <Input
            label="Cantidad"
            type="number"
            step="0.1"
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
          />
          <Input
            label="Precio Unitario ($)"
            type="number"
            step="0.01"
            value={form.unit_price}
            onChange={e => setForm({ ...form, unit_price: e.target.value })}
            className="text-success font-black"
          />

          <div className="md:col-span-2 mt-4 flex gap-3">
            {duplicateWarning ? (
              <Button 
                className="flex-1 py-5 shadow-2xl bg-danger hover:bg-danger-light" 
                onClick={(e) => handleSave(e, true)} 
                disabled={processing}
              >
                ⚠️ Confirmar Duplicado
              </Button>
            ) : (
              <Button className="flex-1 py-5 shadow-2xl" onClick={(e) => handleSave(e)} disabled={processing}>
                ✓ Confirmar Cambios
              </Button>
            )}
            <Button variant="ghost" className="px-8" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* No section selected yet */}
      {!selectedSectionId && !isEditing && (
        <div className="p-8 text-center">
          <p className="text-[10px] text-tx-muted uppercase tracking-widest opacity-50">
            Selecciona una sección para comenzar
          </p>
        </div>
      )}
    </Card>
  );
};

export default RegistryForm;
