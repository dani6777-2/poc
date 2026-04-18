import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { tenantService } from "../../services/tenant.service";

export default function HomeSwitcherModal({ isOpen, onClose }) {
  const { user, activeTenant, switchTenant } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTenants();
      setError(null);
      setJoinCode("");
      setInviteCode("");
    }
  }, [isOpen]);

  const loadTenants = async () => {
    try {
      const data = await tenantService.getMyAccess();
      setTenants(data);
    } catch (err) {
      setError("Failed to load your access list.");
    }
  };

  const handleSwitch = (tenant) => {
    switchTenant(tenant);
    onClose();
  };

  const handleJoin = async () => {
    if (!joinCode) return;
    setLoading(true);
    try {
      const data = await tenantService.joinTenant(joinCode);
      await loadTenants();
      setJoinCode("");
      // Automatically switch to joined tenant
      handleSwitch(data);
    } catch (err) {
      setError("Invalid or expired invite code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetInvite = async () => {
    try {
      const { code } = await tenantService.getInviteCode();
      setInviteCode(code);
    } catch (err) {
      setError("Only owners can generate invite codes.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-500">
      <div 
        className="absolute inset-0 bg-primary/95 backdrop-blur-3xl" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-4xl glass-heavy rounded-[3rem] sm:rounded-[4rem] border-none shadow-premium bg-secondary overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 sm:px-12 pt-10 sm:pt-12 pb-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-0">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-tx-primary tracking-tighter leading-none uppercase">
                Workspaces
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="h-0.5 w-10 bg-accent/30" />
                <div className="text-[9px] font-black tracking-[0.4em] uppercase text-accent opacity-80">
                  Switch Environment
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-xl hover:bg-danger/10 hover:text-danger hover:rotate-90 transition-all active:scale-90 shadow-inner"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 px-8 sm:px-12 overflow-y-auto no-scrollbar space-y-10 pb-10">
          
          {/* Workspace Grid */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-tx-muted ml-2 opacity-50">
              Active Access Nodes
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSwitch(t)}
                  className={`
                    p-6 rounded-[2.5rem] border transition-all cursor-pointer group flex items-center gap-6 relative overflow-hidden
                    ${activeTenant?.id === t.id 
                      ? "bg-accent text-white shadow-2xl shadow-glow-accent ring-1 ring-white/20 translate-x-1" 
                      : "bg-tx-primary/5 border-transparent hover:border-accent/30 hover:bg-tx-primary/10 hover:translate-x-1"}
                  `}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform group-hover:scale-110 shrink-0 ${activeTenant?.id === t.id ? 'bg-white/20' : (t.role === 'owner' ? 'bg-linear-to-br from-accent to-purple' : 'bg-linear-to-br from-success to-emerald')}`}>
                    {t.role === 'owner' ? "🏠" : "🤝"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-lg font-black tracking-tight uppercase truncate mb-1 ${activeTenant?.id === t.id ? 'text-white' : 'text-tx-primary'}`} title={t.name}>{t.name}</div>
                    <div className={`text-[9px] font-bold uppercase tracking-[0.2em] opacity-60 ${activeTenant?.id === t.id ? 'text-white/80' : 'text-tx-muted'}`}>
                      Access Provider: {t.role.toUpperCase()}
                    </div>
                  </div>
                  {activeTenant?.id === t.id && (
                    <div className="w-7 h-7 rounded-full bg-white text-accent flex items-center justify-center text-xs animate-in zoom-in shrink-0 shadow-lg ring-4 ring-white/10">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-linear-to-r from-transparent via-border-base/30 to-transparent" />

          {/* Action Cards Surface */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-tx-muted ml-2 opacity-50">
              Administrative Protocols
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Join Card */}
              <div className="bg-tx-primary/5 p-8 rounded-[2.5rem] space-y-6 border border-transparent hover:border-accent/10 transition-colors flex flex-col justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-lg">✨</div>
                  <div className="space-y-1">
                    <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-tx-primary leading-none">Join Workspace</h4>
                    <p className="text-[8px] font-bold text-tx-muted uppercase tracking-widest opacity-40">Enter protocol code</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="PROTOCOL CODE"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-secondary border border-accent/10 rounded-xl px-5 py-4 text-xs font-black tracking-widest placeholder:text-tx-muted/20 focus:border-accent/40 outline-hidden transition-all text-center"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={loading || !joinCode}
                    className="w-full h-14 bg-accent hover:bg-accent-hover text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-accent/20 active:scale-[0.98] disabled:opacity-50 transition-all"
                  >
                    {loading ? "..." : "DEPLOY ACCESS NODE"}
                  </button>
                </div>
              </div>

              {/* Invite Card */}
              <div className="bg-tx-primary/5 p-8 rounded-[2.5rem] space-y-6 border border-transparent hover:border-accent/10 transition-colors flex flex-col justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple/10 text-purple flex items-center justify-center text-lg">👑</div>
                  <div className="space-y-1">
                    <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-tx-primary leading-none">Access Control</h4>
                    <p className="text-[8px] font-bold text-tx-muted uppercase tracking-widest opacity-40">Manage membership</p>
                  </div>
                </div>
                {inviteCode ? (
                  <div className="space-y-3 animate-in zoom-in">
                    <div className="bg-linear-to-r from-accent to-purple text-white p-5 rounded-xl flex items-center justify-between group shadow-xl">
                      <span className="text-base font-black tracking-[0.4em] ml-2 truncate font-mono">{inviteCode}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(inviteCode)}
                        className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-base hover:bg-white/30 transition-all active:scale-90 shrink-0"
                      >
                        📋
                      </button>
                    </div>
                    <p className="text-center text-[7px] font-black text-tx-muted uppercase tracking-[0.25em] opacity-40">Protocol Key Assigned</p>
                  </div>
                ) : (
                  <button
                    onClick={handleGetInvite}
                    className="w-full h-14 bg-linear-to-r from-accent/10 to-purple/10 border border-accent/20 hover:border-accent/40 text-tx-primary rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 group shadow-inner active:scale-[0.98]"
                  >
                    <span className="text-lg opacity-60 group-hover:rotate-90 transition-transform">➕</span>
                    GENERATE ACCESS KEY
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-[9px] font-black uppercase tracking-[0.3em] text-center animate-in slide-in-from-top-4">
              ⚠️ Protocol Error: {error}
            </div>
          )}
        </div>

        {/* Fixed Legal/Context Footer */}
        <div className="bg-secondary/80 backdrop-blur-md px-8 sm:px-12 py-6 border-t border-border-base/40">
          <p className="text-[9px] font-bold text-tx-muted uppercase tracking-[0.25em] leading-relaxed opacity-40">
            Selected workspace context is applied to global financial orchestration, including revenue matrix and expense analysis.
          </p>
        </div>
      </div>
    </div>

  );
}