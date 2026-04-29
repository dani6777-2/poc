import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Select } from '../atoms';
import { STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, SECTION_DESPENSA, SECTION_SERVICIOS } from '../../constants/forms';

const RegistryForm = ({
  editId,
  form,
  setForm,
  formType,           // 'despensa' | 'servicios'
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

  // Determine target section name for filtering
  const targetSectionName = formType === 'servicios' ? SECTION_SERVICIOS : SECTION_DESPENSA;
  const targetSection = (sections || []).find(s => s.name === targetSectionName);

  // Filter categories to only those belonging to this section
  const filteredCategories = (categories || []).filter(cat => {
    return cat.section_id === targetSection?.id;
  });

  // Determine display mode
  const isServicio  = formType === 'servicios';
  const isDespensa  = formType === 'despensa';
  const isEditing   = !!editId;

  const TAB_CLASSES = (active) =>
    `flex-1 py-3 px-4 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl transition-all duration-300 transform active:scale-95 ${
      active
        ? 'bg-accent text-white shadow-xl shadow-accent/25 border border-accent/20'
        : 'text-tx-muted hover:bg-tx-primary/5 hover:text-tx-primary'
    }`;

  const handleTabChange = (type) => {
    if (isEditing) return; // don't switch tabs while editing
    setFormType(type);
  };

  return (
    <Card className={`p-5 md:p-8 border border-border-base shadow-premium transition-all duration-500 ${isEditing ? 'border-accent/60 shadow-accent/10' : ''}`}>

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-sm font-black text-tx-primary tracking-[0.25em] uppercase">
            {isEditing ? '✏️ Editar Registro' : (isDespensa ? '🛒 Despensa' : '📄 Servicios')}
          </h3>
          <p className="text-[10px] text-tx-muted mt-1 font-bold uppercase tracking-widest opacity-50">
            {isEditing
              ? 'Modificando entrada existente'
              : isDespensa
                ? 'Supermercado · Abarrotes · Frutas · Aseo'
                : 'Luz · Agua · Internet · Gas · Otros'}
          </p>
        </div>

        {/* Tab switcher — disabled if editing */}
        {!isEditing && (
          <div className="flex bg-tx-primary/5 p-1 rounded-2xl gap-1 min-w-[260px]">
            <button className={TAB_CLASSES(isDespensa)} onClick={() => handleTabChange('despensa')}>
              🛒 Despensa
            </button>
            <button className={TAB_CLASSES(isServicio)} onClick={() => handleTabChange('servicios')}>
              📄 Servicios
            </button>
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

      {/* === DESPENSA FORM === */}
      {isDespensa && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Input
            label="Producto"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Leche entera, Jabón…"
            className="md:col-span-2"
          />
          <Select
            label="Categoría"
            value={form.category_id}
            onChange={e => setForm({ ...form, category_id: e.target.value })}
            options={(filteredCategories.length ? filteredCategories : (categories || [])).map(c => ({ value: c.id, label: c.name }))}
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
                {isEditing ? '✓ Confirmar Cambios' : '+ Añadir a Despensa'}
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

      {/* === SERVICIOS FORM === */}
      {isServicio && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Input
            label="Servicio"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Factura Luz Mayo…"
            className="md:col-span-2"
          />
          <Select
            label="Categoría"
            value={form.category_id}
            onChange={e => setForm({ ...form, category_id: e.target.value })}
            options={(filteredCategories.length ? filteredCategories : (categories || [])).map(c => ({ value: c.id, label: c.name }))}
          />
          <Input
            label="Fecha de Vencimiento"
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
            label="Monto Total ($)"
            type="number"
            step="0.01"
            value={form.unit_price}
            onChange={e => setForm({ ...form, unit_price: e.target.value })}
            className="text-accent font-black"
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
                 {isEditing ? '✓ Confirmar Cambios' : '+ Registrar Servicio'}
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
    </Card>
  );
};

export default RegistryForm;
