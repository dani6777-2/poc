import React from 'react';
import Card from '../atoms/Card';
import Input from '../atoms/Input';
import RegistryRow from '../molecules/RegistryRow';

const RegistryTable = ({
  search,
  setSearch,
  filter,
  setFilter,
  REGISTRY_FILTERS,
  filtered,
  handleStatus,
  handleEdit,
  setConfirmData,
  isAutoExpense,
  getSourceLabel,
  fmt
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 md:p-8 border-b border-border-base flex flex-col lg:flex-row justify-between items-center gap-6 bg-tx-primary/[0.01]">
        <div className="flex flex-col gap-1 w-full lg:w-auto">
          <h3 className="text-[11px] font-black text-tx-primary uppercase tracking-[0.25em]">Financial Flow History</h3>
          <Input
            placeholder="🔍 Filter records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="py-2.5 px-4 h-auto text-xs w-full lg:w-64"
          />
        </div>
        <div className="flex bg-tx-primary/5 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar max-w-full">
          {REGISTRY_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${filter === f.id
                  ? 'bg-accent text-white shadow-lg glow-accent'
                  : 'text-tx-secondary hover:bg-tx-primary/5'
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
              <th className="p-5">Detail</th>
              <th className="p-5 hidden md:table-cell">Category</th>
              <th className="p-5 text-right w-24">Qty</th>
              <th className="p-5 hidden md:table-cell text-right">Unit Price</th>
              <th className="p-5 text-right pr-8">Subtotal</th>
              <th className="p-5 w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {filtered.map(item => (
              <RegistryRow
                key={item.id}
                item={item}
                auto={isAutoExpense(item)}
                source={getSourceLabel(item.source)}
                isBought={item.status === 'Bought'}
                handleStatus={handleStatus}
                handleEdit={handleEdit}
                setConfirmData={setConfirmData}
                fmt={fmt}
              />
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="p-20 text-center text-tx-muted font-bold opacity-30 italic text-sm">
            End of data flow in this spectrum
          </div>
        )}
      </div>
    </Card>
  );
};

export default RegistryTable;
