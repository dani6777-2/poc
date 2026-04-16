import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cardService, analysisService } from "../../services";
import { NAVBAR_SECTIONS } from "../../constants/navigation";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import HomeSwitcherModal from "./HomeSwitcherModal";

export default function Navbar() {
  const [alerts, setAlerts] = useState({ card: null, health: null });
  const [isOpen, setIsOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { user, activeTenant, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);

    cardService
      .getCardBalance(month)
      .then((data) => {
        if (data.is_configured)
          setAlerts((a) => ({
            ...a,
            card: data.critical ? "danger" : data.alert ? "warning" : null,
          }));
      })
      .catch(() => {});

    analysisService
      .getHealthAlerts(month)
      .then((data) => {
        if (!data.no_revenue)
          setAlerts((a) => ({
            ...a,
            health: data.global_level === "ok" ? null : data.global_level,
          }));
      })
      .catch(() => {});
  }, []);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Hide mobile navbar toggler when user opens a form/keyboard
  useEffect(() => {
    const handleFocusIn = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) {
        setIsKeyboardOpen(true);
        setIsOpen(false); // also ensure drawer is closed
      }
    };
    const handleFocusOut = () => setIsKeyboardOpen(false);

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const alertDot = (type) => (
    <span
      className={`w-2 h-2 rounded-full inline-block ml-auto shrink-0 animate-pulse ${type === "danger" ? "bg-danger shadow-[0_0_10px_rgba(244,63,94,0.6)]" : "bg-warning shadow-[0_0_10px_rgba(245,158,11,0.6)]"}`}
    />
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden fixed top-6 left-6 z-[1001] w-12 h-12 glass rounded-2xl flex items-center justify-center text-xl shadow-2xl transition-all duration-300 active:scale-95 ${isKeyboardOpen ? "opacity-0 -translate-y-20 pointer-events-none" : "opacity-100"}`}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-primary/60 backdrop-blur-sm z-[1000] animate-in fade-in duration-300"
        />
      )}

      {/* Sidebar Navigation */}
      <nav
        className={`
        fixed left-0 top-0 h-screen bg-secondary/80 backdrop-blur-3xl border-r border-border-base p-7 flex flex-col gap-2 z-[1000] shadow-2xl transition-all duration-500
        ${isOpen ? "translate-x-0 w-[300px]" : "-translate-x-full lg:translate-x-0 lg:w-[280px]"}
      `}
      >
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-accent to-purple flex items-center justify-center text-xl shadow-lg shadow-accent/20 animate-float">
            🏦
          </div>
          <div>
            <div className="text-tx-primary font-black text-xl leading-none tracking-tighter">
              FinOps<span className="text-accent ml-0.5">4.5</span>
            </div>
            <div className="text-[9px] font-black tracking-[0.3em] uppercase text-tx-muted opacity-40 mt-1">
              Corporate Core
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="ml-auto w-10 h-10 rounded-2xl glass flex items-center justify-center text-lg hover:bg-accent/10 transition-all border-accent/10"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="flex-1 space-y-9 overflow-y-auto no-scrollbar pr-2 custom-scrollbar">
          {NAVBAR_SECTIONS.map((sec) => (
            <div key={sec.title} className="space-y-2">
              <div className="px-4 text-[10px] font-black text-tx-muted uppercase tracking-[0.25em] mb-4 opacity-40">
                {sec.title}
              </div>
              {sec.links.map((l) => {
                const alertType =
                  l.alertKey === "card"
                    ? alerts.card
                    : l.alertKey === "health"
                      ? alerts.health
                      : null;
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === "/"}
                    className={({ isActive }) => `
                      flex items-center gap-3.5 py-3 px-4 rounded-2xl font-bold text-[13px] transition-all duration-300 group relative overflow-hidden
                      ${
                        isActive
                          ? "bg-accent text-white shadow-lg glow-accent scale-[1.02]"
                          : "text-tx-secondary hover:bg-tx-primary/5 hover:text-tx-primary hover:translate-x-1"
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`text-[17px] transition-transform duration-300 group-hover:scale-110 ${isActive ? "drop-shadow-md" : "grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"}`}
                        >
                          {l.icon}
                        </span>
                        <span className="flex-1 tracking-tight">{l.label}</span>
                        {alertType && alertDot(alertType)}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-tx-primary rounded-r-full" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-8 border-t border-border-base space-y-4">
          <div 
            onClick={() => setShowSwitcher(true)}
            className="glass p-4 rounded-[1.5rem] flex items-center gap-3 border-accent/20 cursor-pointer hover:bg-accent/5 transition-all group"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg transition-transform group-hover:scale-110 ${activeTenant?.role === 'owner' ? 'bg-linear-to-br from-accent to-purple' : 'bg-linear-to-br from-success to-emerald'}`}>
              {activeTenant?.role === 'owner' ? (user?.email?.charAt(0).toUpperCase() || "👤") : "🤝"}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[11px] font-black text-tx-primary truncate flex items-center gap-2">
                {user?.email || "Guest User"}
                {activeTenant?.role === 'guest' && (
                  <span className="text-[7px] bg-emerald/10 text-emerald border border-emerald/20 px-1 rounded-sm">GUEST</span>
                )}
              </div>
              <div className="text-[9px] font-bold text-tx-muted uppercase tracking-widest opacity-60">
                🏠 {activeTenant?.name || "Personal Space"}
              </div>
            </div>
          </div>

          <HomeSwitcherModal 
            isOpen={showSwitcher} 
            onClose={() => setShowSwitcher(false)} 
          />

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full group flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-tx-muted hover:text-danger hover:bg-danger/10 transition-all duration-300 border border-transparent hover:border-danger/20"
          >
            <span className="text-sm grayscale group-hover:grayscale-0 transition-all">
              🚪
            </span>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}
