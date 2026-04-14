/**
 * Finance-related utility functions.
 */

export const REGISTRY_DESCRIPTION_PREFIX = "📝 Registry: ";
export const AUTO_PREFIXES = [REGISTRY_DESCRIPTION_PREFIX, '💳 Card:', '🛒 Supermarket'];

export const isAutoSync = (description, is_automatic) => is_automatic || AUTO_PREFIXES.some(p => description?.startsWith(p));

export const isAutoExpense = (item) => item.source && (item.source.startsWith('BA:') || item.source.startsWith('BB:'));

export const getSourceLabel = (source) => {
  if (!source) return null;
  if (source.startsWith('BA:')) return { label: '🏪 Supermarket', variant: 'info' };
  if (source.startsWith('BB:')) return { label: '🥩 Market', variant: 'success' };
  if (source === 'OCR') return { label: '📸 AI Scan', variant: 'accent' };
  return null;
};

export const getStatusVariant = (status) => {
  switch (status) {
    case 'Bought': return 'success';
    case 'Planned': return 'muted';
    default: return 'muted';
  }
};
