import React, { useState, useEffect } from 'react';
import { expenseService } from '../../services';
import { useToast } from '../../context/ToastContext';

export function AlertPanel() {
  const [alerts, setAlerts] = useState({ active: [], history: [] });
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await expenseService.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await expenseService.acknowledgeAlert(alertId);
      addToast('Alert acknowledged', 'success');
      fetchAlerts();
    } catch (err) {
      addToast('Failed to acknowledge alert', 'danger');
    }
  };

  if (loading) return null;

  if (alerts.active.length === 0 && alerts.history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {alerts.active.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-400">
              {alerts.active.length} Active Alert{alerts.active.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {alerts.active.map(alert => (
              <div key={alert.id} className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-white">Category #{alert.category_id}</span>
                  <span className="text-gray-400 ml-2">{alert.month}</span>
                  <span className="text-red-400 ml-2">
                    {alert.actual.toFixed(2)} / {alert.budget.toFixed(2)} ({alert.threshold}%)
                  </span>
                </div>
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export function ConflictResolutionModal({ isOpen, conflictData, onResolve, onCancel }) {
  if (!isOpen || !conflictData) return null;

  const { localValue, serverValue, field, resourceType } = conflictData;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-2xl border border-amber-500/50 w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-lg font-bold text-white">Concurrency Conflict</h2>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          This {resourceType} was modified by another user. Your changes conflict with the current server state.
        </p>

        <div className="space-y-3 mb-6">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="text-xs text-blue-400 uppercase tracking-wider mb-1">Your Change</div>
            <div className="text-white font-mono">{field}: {localValue ?? 'null'}</div>
          </div>
          
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Server Value</div>
            <div className="text-white font-mono">{field}: {serverValue ?? 'null'}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Keep Server Value
          </button>
          <button
            onClick={onResolve}
            className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600"
          >
            Force Update
          </button>
        </div>
      </div>
    </div>
  );
}


export function SyncPreviewModal({ isOpen, previewData, onConfirm, onCancel }) {
  if (!isOpen || !previewData) return null;

  const { changes = [], affected_records = 0 } = previewData;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Sync Preview</h2>
          <p className="text-sm text-gray-400">
            {affected_records} record{affected_records !== 1 ? 's' : ''} will be updated
          </p>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {changes.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No changes detected</p>
          ) : (
            <div className="space-y-2">
              {changes.slice(0, 20).map((change, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-gray-800 text-sm">
                  <span className="text-gray-300">{change.concept || change}</span>
                </div>
              ))}
              {changes.length > 20 && (
                <p className="text-gray-500 text-sm text-center">
                  +{changes.length - 20} more changes
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}


export function SimulationModal({ isOpen, year, onClose }) {
  const [changes, setChanges] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSimulate = async () => {
    if (Object.keys(changes).length === 0) {
      addToast('Add at least one change to simulate', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const data = await expenseService.simulateScenario(year, changes);
      setResult(data);
    } catch (err) {
      addToast('Simulation failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">What-If Simulation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Add changes (JSON format: {"{concept_key: {field: value}}"})
            </label>
            <textarea
              className="w-full h-32 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white font-mono text-sm"
              value={JSON.stringify(changes, null, 2)}
              onChange={(e) => {
                try {
                  setChanges(JSON.parse(e.target.value));
                } catch {}
              }}
              placeholder='{"cat1:abc": {"jan": 100}}'
            />
          </div>
          
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-accent text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Simulating...' : 'Run Simulation'}
          </button>

          {result && (
            <div className="mt-4 p-4 rounded-lg bg-gray-800">
              <div className="text-sm text-gray-400 mb-2">Results</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Current Annual Total</div>
                  <div className="text-xl font-bold text-white">
                    ${result.current?.annual_total?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Simulated Annual Total</div>
                  <div className="text-xl font-bold text-accent">
                    ${result.simulated?.annual_total?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <span className="text-gray-400">Delta: </span>
                <span className={result.delta >= 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {result.delta >= 0 ? '+' : ''}{result.delta?.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}