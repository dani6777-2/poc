import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';

const SECTION_DESPENSA  = 'Comida y Despensa';
const SECTION_SERVICIOS = 'Servicios y Gastos Fijos';

const SectionBadge = ({ sectionName }) => {
  if (sectionName === SECTION_DESPENSA)
    return <Badge variant="success" className="w-fit text-[8px]">🛒 Despensa</Badge>;
  if (sectionName === SECTION_SERVICIOS)
    return <Badge variant="info" className="w-fit text-[8px]">📄 Servicios</Badge>;
  return sectionName
    ? <Badge variant="muted" className="w-fit text-[8px]">{sectionName}</Badge>
    : null;
};

const PaymentBadge = ({ method }) => {
  if (method === 'credit')
    return <Badge variant="warning" className="w-fit text-[8px]">💳 Crédito</Badge>;
  return <Badge variant="muted" className="w-fit text-[8px]">💵 Efectivo</Badge>;
};

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
  const { activeTenant } = useAuth();
  const isGuest = activeTenant?.role === 'guest';

  return (
    <tr className={`hover:bg-tx-primary/[0.02] transition-colors group ${isBought ? '' : 'opacity-60'} ${auto ? 'bg-accent/[0.02]' : ''}`}>
      {/* Status toggle */}
      <td className="p-4 pl-8 text-center">
        <button
          onClick={() => handleStatus(item)}
          disabled={auto || isGuest}
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] border-2 transition-all duration-300 transform active:scale-90 ${
            isBought
              ? 'bg-success text-white border-success shadow-lg shadow-success/30 scale-110'
              : 'bg-tx-primary/5 border-tx-primary/10 text-tx-muted/40 hover:border-tx-primary/40 hover:text-tx-secondary'
          }`}
        >
          {isBought ? '✓' : '—'}
        </button>
      </td>

      {/* Name + date + source badge */}
      <td className="p-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-tx-primary leading-tight">{item.name}</span>
          <div className="flex items-center gap-2 mt-1">
            {item.date && <span className="text-[10px] font-black text-tx-muted opacity-60 uppercase">{item.date}</span>}
            {source && <Badge variant={source.variant} className="w-fit">{source.label}</Badge>}
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="p-4 hidden md:table-cell">
        <Badge variant="muted">{item.category_name}</Badge>
      </td>

      {/* Section */}
      <td className="p-4 hidden lg:table-cell">
        <SectionBadge sectionName={item.section_name} />
      </td>

      {/* Payment method */}
      <td className="p-4 hidden md:table-cell">
        <PaymentBadge method={item.payment_method} />
      </td>

      {/* Quantity */}
      <td className="p-4 text-right tabular-nums text-sm font-bold text-tx-secondary">
        {item.quantity} <span className="text-[10px] opacity-40 ml-1 uppercase">{item.unit_name}</span>
      </td>

      {/* Unit price */}
      <td className="p-4 hidden md:table-cell text-right tabular-nums text-sm font-bold text-tx-muted">
        {fmt(item.unit_price)}
      </td>

      {/* Subtotal */}
      <td className="p-4 text-right pr-8 tabular-nums text-sm font-black text-success leading-none">
        {fmt(item.subtotal)}
      </td>

      {/* Actions */}
      {!isGuest && (
        <td className="p-4 text-right pr-10">
          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
            {!auto && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleEdit(item)}
                className="w-8 h-8 !p-0 flex items-center justify-center"
              >
                ✏️
              </Button>
            )}
            {!auto && (
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:!text-danger w-8 h-8 !p-0 flex items-center justify-center" 
                onClick={() => setConfirmData(item.id)}
              >
                🗑️
              </Button>
            )}
            {auto && (
              <Link to={item.source?.startsWith('BA:') ? '/block-a' : '/block-b'}>
                <Button variant="outline" size="sm" className="w-8 h-8 !p-0 flex items-center justify-center">🔗</Button>
              </Link>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};

export default RegistryRow;
