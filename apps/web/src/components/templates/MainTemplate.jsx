import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../organisms';

export default function MainTemplate({ children }) {
  const { token, activeTenant } = useAuth();
  const isGuest = activeTenant?.role === 'guest';
  
  if (!token) return <>{children}</>;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-primary text-tx-primary selection:bg-accent/30 font-sans">
      <Navbar />
      <main className="lg:ml-[280px] flex-1 min-w-0 flex flex-col min-h-screen relative transition-all duration-300">
        {isGuest && (
          <div className="sticky top-0 z-[100] w-full bg-accent text-white py-2 px-4 text-center font-black text-[10px] uppercase tracking-[0.2em] shadow-lg animate-in slide-in-from-top duration-500">
            <span className="opacity-70">Viewing</span> {activeTenant.name} <span className="opacity-70">as</span> GUEST <span className="mx-2">•</span> READ-ONLY ACCESS
          </div>
        )}
        <div className="flex-1 p-4 pt-24 md:p-6 md:pt-24 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}