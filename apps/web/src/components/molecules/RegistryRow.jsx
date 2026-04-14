import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';

const RegistryRow = ({ 
  item, 
  auto, 
  source, 
  isBought, 
  handleStatus, 
  handleEdit, 
  setConfirmData, 
  fmt 
}) => {
  return (
    <tr className={`hover:bg-tx-primary/[0.02] transition-colors group ${isBought ? '' : 'opacity-60'} ${auto ? 'bg-accent/[0.02]' : ''}`}>
      <td className="p-4 pl-8 text-center">
        <button
          onClick={() => handleStatus(item)} 
          disabled={auto}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] border transition-all ${
            isBought 
              ? 'bg-success/20 border-success/30 text-success glow-success' 
              : 'bg-tx-primary/5 border-border-base grayscale'
          }`}
        >
          {isBought ? '✓' : '—'}
        </button>
      </td>
      <td className="p-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-tx-primary leading-tight">{item.name}</span>
          {source && <Badge variant={source.variant} className="mt-1 w-fit">{source.label}</Badge>}
        </div>
      </td>
      <td className="p-4 hidden md:table-cell">
        <Badge variant="muted">{item.category_name}</Badge>
      </td>
      <td className="p-4 text-right tabular-nums text-sm font-bold text-tx-secondary">
        {item.quantity} <span className="text-[10px] opacity-40 ml-1 uppercase">{item.unit_name}</span>
      </td>
      <td className="p-4 hidden md:table-cell text-right tabular-nums text-sm font-bold text-tx-muted">
        {fmt(item.unit_price)}
      </td>
      <td className="p-4 text-right pr-8 tabular-nums text-sm font-black text-success leading-none">
        {fmt(item.subtotal)}
      </td>
      <td className="p-4 text-right pr-8">
        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          {!auto && (
            <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
              ✏️
            </Button>
          )}
          {!auto && (
            <Button variant="outline" size="sm" className="hover:!text-danger" onClick={() => setConfirmData({ item })}>
              🗑️
            </Button>
          )}
          {auto && (
            <Link to={item.source?.startsWith('BA:') ? '/block-a' : '/block-b'}>
              <Button variant="outline" size="sm">🔗</Button>
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
};

export default RegistryRow;
