import React, { useState, useEffect } from 'react';

export function FilterPanel({ isOpen, onClose, filters, onApply }) {
  const [localFilters, setLocalFilters] = useState({
    is_automatic: null,
    has_drift: null,
    category_id: null,
    concept_origin: null
  });

  useEffect(() => {
    const saved = localStorage.getItem('annual_expense_filters');
    if (saved) {
      try {
        setLocalFilters(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleApply = () => {
    localStorage.setItem('annual_expense_filters', JSON.stringify(localFilters));
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({
      is_automatic: null,
      has_drift: null,
      category_id: null,
      concept_origin: null
    });
    localStorage.removeItem('annual_expense_filters');
    onApply(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[100] pt-20 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Advanced Filters</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <select
              value={localFilters.is_automatic ?? ''}
              onChange={(e) => setLocalFilters(f => ({ ...f, is_automatic: e.target.value === '' ? null : e.target.value === 'true' }))}
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
            >
              <option value="">All</option>
              <option value="true">Automatic (from Registry)</option>
              <option value="false">Manual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Origin</label>
            <select
              value={localFilters.concept_origin ?? ''}
              onChange={(e) => setLocalFilters(f => ({ ...f, concept_origin: e.target.value || null }))}
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
            >
              <option value="">All</option>
              <option value="registry">Registry</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={localFilters.has_drift ?? ''}
              onChange={(e) => setLocalFilters(f => ({ ...f, has_drift: e.target.value === '' ? null : e.target.value === 'true' }))}
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
            >
              <option value="">All</option>
              <option value="false">Consistent</option>
              <option value="true">Has Drift</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}


export function FilterBadge({ filters, onClear }) {
  if (!filters) return null;
  
  const activeFilters = Object.entries(filters).filter(([k, v]) => v !== null);
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeFilters.map(([key, value]) => (
        <span
          key={key}
          className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent border border-accent/40 flex items-center gap-1"
        >
          {key}: {String(value)}
          <button onClick={() => onClear(key)} className="hover:text-white">×</button>
        </span>
      ))}
    </div>
  );
}