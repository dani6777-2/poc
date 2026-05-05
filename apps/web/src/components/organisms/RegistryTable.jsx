import { useAuth } from '../../context/AuthContext';
import { Card, Input, Select } from '../atoms';
import RegistryRow from '../molecules/RegistryRow';

import { fmt } from '../../utils/formatters';
import { isAutoExpense, getSourceLabel } from '../../utils/finance';
import { REGISTRY_FILTERS, CHANNEL_FILTERS } from '../../constants/forms';

const RegistryTable = ({
  search,
  setSearch,
  filter,
  setFilter,
  sectionFilter,
  setSectionFilter,
  categoryFilter,
  setCategoryFilter,
  channelFilter,
  setChannelFilter,
  items,
  sections,
  categories,
  onEdit,
  onDelete,
  onStatus,
  loading
}) => {
  const { activeTenant } = useAuth();
  const isGuest = activeTenant?.role === 'guest';

  // Section options with "all" option
  const sectionOptions = [
    { value: '', label: '📂 Todas las Secciones' },
    ...(sections || []).map(s => ({ value: s.id, label: `${s.icon} ${s.name}` }))
  ];

  // Category options filtered by selected section
  const categoryOptions = [
    { value: '', label: '📦 Todas las Categorías' },
    ...(categories || []).filter(c => !sectionFilter || c.section_id === Number(sectionFilter))
      .map(c => ({ value: c.id, label: c.name }))
  ];

  return (
    <Card className="overflow-hidden">
      {/* Filter Row */}
      <div className="p-4 md:p-5 border-b border-border-base bg-tx-primary/[0.01] space-y-3">
        {/* Search + Status Filters */}
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col gap-2 w-full lg:w-auto flex-1">
            <Input
              placeholder="🔍 Buscar registros..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="py-3 px-5 h-auto text-xs w-full lg:w-72 bg-tx-primary/[0.04] border-transparent focus:border-accent/40 rounded-2xl shadow-inner"
            />
          </div>
          <div className="flex bg-tx-primary/5 p-1.5 rounded-[1.25rem] gap-1 overflow-x-auto no-scrollbar">
            {REGISTRY_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap active:scale-95 ${filter === f.id
                    ? 'bg-accent text-white shadow-xl shadow-accent/25 ring-1 ring-accent/30'
                    : 'text-tx-muted hover:bg-tx-primary/5 hover:text-tx-primary'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            value={sectionFilter || ''}
            onChange={e => {
              setSectionFilter(e.target.value);
              setCategoryFilter(''); // Reset category when section changes
            }}
            options={sectionOptions}
            className="text-xs min-w-[160px]"
            placeholder="📂 Sección"
          />
          <Select
            value={categoryFilter || ''}
            onChange={e => setCategoryFilter(e.target.value)}
            options={categoryOptions}
            className="text-xs min-w-[160px]"
            placeholder="📦 Categoría"
          />
          <Select
            value={channelFilter || ''}
            onChange={e => setChannelFilter(e.target.value)}
            options={CHANNEL_FILTERS}
            className="text-xs min-w-[140px]"
            placeholder="💳 Canal"
          />
          
          {/* Clear filters button */}
          {(sectionFilter || categoryFilter || channelFilter) && (
            <button
              onClick={() => {
                setSectionFilter('');
                setCategoryFilter('');
                setChannelFilter('');
              }}
              className="px-3 py-2 text-[10px] font-black text-danger uppercase tracking-widest hover:bg-danger/10 rounded-xl"
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[9px] font-black uppercase tracking-widest text-tx-muted bg-tx-primary/[0.01]">
              <th className="p-5 pl-8 w-12 text-center">ST</th>
              <th className="p-5">Detalle</th>
              <th className="p-5 hidden md:table-cell">Categoría</th>
              <th className="p-5 hidden lg:table-cell">Sección</th>
              <th className="p-5 hidden md:table-cell">Pago</th>
              <th className="p-5 text-right w-24">Qty</th>
              <th className="p-5 hidden md:table-cell text-right">P. Unit</th>
              <th className="p-5 text-right pr-8">Subtotal</th>
              {!isGuest && <th className="p-5 w-28">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {(items || []).map(item => (
              <RegistryRow
                key={item.id}
                item={item}
                auto={isAutoExpense(item)}
                source={getSourceLabel(item.source)}
                isBought={item.status === 'Bought'}
                handleStatus={onStatus}
                handleEdit={onEdit}
                setConfirmData={onDelete}
                fmt={fmt}
              />
            ))}
          </tbody>
        </table>
        {(!items || !items.length) && (
          <div className="p-20 text-center text-tx-muted font-bold opacity-30 italic text-sm">
            End of data flow in this spectrum
          </div>
        )}
      </div>
    </Card>
  );
};

export default RegistryTable;
