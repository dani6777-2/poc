import React, { useState, useEffect } from 'react';
import { expenseService } from '../../services';
import { useToast } from '../../context/ToastContext';

export function DriftIndicator({ year, onDriftClick }) {
  const [drifts, setDrifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchDrifts = async () => {
      setLoading(true);
      try {
        const data = await expenseService.getDriftHistory(year, 50);
        setDrifts(data.drifts || []);
      } catch (err) {
        console.error('Failed to fetch drifts:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrifts();
    const interval = setInterval(fetchDrifts, 30000);
    return () => clearInterval(interval);
  }, [year]);

  const unresolvedDrifts = drifts.filter(d => !d.is_resolved);
  const recentDrifts = unresolvedDrifts.filter(d => {
    const detected = new Date(d.detected_at);
    const now = new Date();
    return (now - detected) / (1000 * 60 * 60) < 24;
  });

  if (unresolvedDrifts.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative cursor-pointer group"
      onClick={onDriftClick}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          {unresolvedDrifts.length} DRIFT{unresolvedDrifts.length > 1 ? 'S' : ''}
        </span>
        {recentDrifts.length > 0 && (
          <span className="text-[10px] text-amber-300">
            ({recentDrifts.length} recent)
          </span>
        )}
      </div>
      
      <div className="absolute top-full left-0 mt-2 w-64 p-3 rounded-xl bg-gray-900 border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          Affected Concepts
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {unresolvedDrifts.slice(0, 5).map(drift => (
            <div key={drift.id} className="text-xs flex justify-between">
              <span className="text-gray-300 truncate">{drift.concept_label || drift.concept_key}</span>
              <span className="text-amber-400 font-mono">{drift.month}</span>
            </div>
          ))}
        </div>
        {unresolvedDrifts.length > 5 && (
          <div className="text-[10px] text-gray-500 mt-2 text-center">
            +{unresolvedDrifts.length - 5} more
          </div>
        )}
      </div>
    </div>
  );
}


export function DriftTimelineModal({ year, isOpen, onClose }) {
  const [drifts, setDrifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchDrifts = async () => {
        setLoading(true);
        try {
          const data = await expenseService.getDriftHistory(year, 100);
          setDrifts(data.drifts || []);
        } catch (err) {
          console.error('Failed to fetch drifts:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDrifts();
    }
  }, [isOpen, year]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Drift Timeline - {year}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : drifts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No drift history for {year}
            </div>
          ) : (
            <div className="space-y-3">
              {drifts.map(drift => (
                <div 
                  key={drift.id}
                  className={`p-3 rounded-lg border ${
                    drift.is_resolved 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-white">
                      {drift.concept_label || drift.concept_key}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      drift.is_resolved 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {drift.is_resolved ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>Month: {drift.month}</span>
                    <span>Detected: {new Date(drift.detected_at).toLocaleDateString()}</span>
                    {drift.resolved_at && (
                      <span>Resolved: {new Date(drift.resolved_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}