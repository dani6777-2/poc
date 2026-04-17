import { useAuth } from '../../context/AuthContext';
import { Card, Input } from '../atoms';
import RegistryRow from '../molecules/RegistryRow';

import { fmt } from '../../utils/formatters';
import { isAutoExpense, getSourceLabel } from '../../utils/finance';
import { REGISTRY_FILTERS } from '../../constants/forms';

const RegistryTable = ({
  search,
  setSearch,
  filter,
  setFilter,
  items,
  onEdit,
  onDelete,
  onStatus,
  loading
}) => {
  const { activeTenant } = useAuth();
  const isGuest = activeTenant?.role === 'guest';
  return (
    <Card className="overflow-hidden">
      <div className="p-6 md:p-5 md:p-8 border-b border-border-base flex flex-col lg:flex-row justify-between items-center gap-6 bg-tx-primary/[0.01]">
        <div className="flex flex-col gap-2 w-full lg:w-auto">
          <h3 className="text-[10px] font-black text-tx-primary/80 uppercase tracking-[0.35em] mb-1">Audit Ledger Flow</h3>
          <Input
            placeholder="🔍 Find transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="py-3 px-5 h-auto text-xs w-full lg:w-72 bg-tx-primary/[0.04] border-transparent focus:border-accent/40 rounded-2xl shadow-inner transition-all"
          />
        </div>
        <div className="flex bg-tx-primary/5 p-1.5 rounded-[1.25rem] gap-1 overflow-x-auto no-scrollbar max-w-full justify-start lg:justify-end">
          {REGISTRY_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap active:scale-95 ${filter === f.id
                  ? 'bg-accent text-white shadow-xl shadow-accent/25 ring-1 ring-accent/30'
                  : 'text-tx-muted hover:bg-tx-primary/5 hover:text-tx-primary'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

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
