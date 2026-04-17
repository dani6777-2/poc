import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { tenantService } from "../../services/tenant.service";
import Card from "../atoms/Card";
import Button from "../atoms/Button";
import Badge from "../atoms/Badge";
import { fmt } from "../../utils/formatters";

const HomeSwitcherModal = ({ isOpen, onClose }) => {
  const { user, activeTenant, switchTenant } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      tenantService
        .getMyAccess()
        .then((data) => setTenants(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <Card
        className="relative w-full max-w-lg bg-secondary/90 border-accent/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-0"
      >
         <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-accent via-purple to-accent animate-shimmer" />
        
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-tx-primary tracking-tighter">
              Switch <span className="text-accent italic font-light">Home</span>
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-tx-primary/5 transition-all text-xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-10 text-center animate-pulse text-tx-muted font-bold uppercase tracking-widest text-[10px]">
                Fetching neural access pathways...
              </div>
            ) : (
              tenants.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    switchTenant(t);
                    onClose();
                  }}
                  className={`
                    p-6 rounded-3xl border-2 transition-all cursor-pointer group relative overflow-hidden
                    ${
                      activeTenant?.id === t.id
                        ? "border-accent bg-accent/5"
                        : "border-border-base hover:border-accent/30 hover:bg-tx-primary/5"
                    }
                  `}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all
                      ${activeTenant?.id === t.id ? "bg-accent text-white" : "bg-secondary text-tx-secondary group-hover:scale-110 shadow-accent/5"}
                    `}>
                      {t.role === "owner" ? "🏠" : "🤝"}
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-[15px] font-black text-tx-primary tracking-tight">
                        {t.name}
                      </div>
                      <div className="text-[10px] font-bold text-tx-muted uppercase tracking-[0.2em] opacity-40 mt-1">
                        {t.role === "owner" ? "Primary Residence" : "Shared Access (Read-only)"}
                      </div>
                    </div>

                    {activeTenant?.id === t.id && (
                       <Badge variant="success" glow className="px-3">Active</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-border-base">
             <Button
                variant="ghost"
                className="w-full h-14 uppercase font-black text-[10px] tracking-[0.3em] opacity-50 hover:opacity-100"
                onClick={onClose}
             >
                Continue Browsing
             </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HomeSwitcherModal;
