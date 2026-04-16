import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../organisms';

export default function MainTemplate({ children }) {
  const { token } = useAuth();
  
  if (!token) return <>{children}</>;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-primary text-tx-primary selection:bg-accent/30 font-sans">
      <Navbar />
      <main className="lg:ml-[280px] flex-1 min-w-0 p-4 pt-24 md:p-6 md:pt-24 lg:p-10 min-h-screen relative transition-all duration-300">
        {children}
      </main>
    </div>
  );
}