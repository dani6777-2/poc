import React from 'react';
import Navbar from '../organisms/Navbar';
import PageHeader from '../molecules/PageHeader';

export default function DashboardTemplate({ 
  title, 
  subtitle, 
  headerAction, 
  children, 
  className = '' 
}) {
  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col md:flex-row bg-bg-base text-tx-secondary selection:bg-accent/20">
      
      {/* Navbar Lateral (Desktop) / Inferior (Mobile) */}
      <nav className="fixed bottom-0 md:relative md:bottom-auto w-full md:w-64 z-50 order-2 md:order-1 flex-shrink-0 border-t md:border-t-0 md:border-r border-border-base bg-bg-surface backdrop-blur-xl bg-opacity-90">
        <Navbar />
      </nav>

      {/* Contenido Principal */}
      <main className={`flex-1 w-full order-1 md:order-2 overflow-y-auto ${className}`}>
        <div className="max-w-[1400px] mx-auto w-full p-4 md:p-8 flex flex-col gap-6 md:gap-8 min-h-full">
          {(title || subtitle) && (
            <PageHeader 
              title={title} 
              subtitle={subtitle} 
              action={headerAction} 
            />
          )}

          {/* Area para inyectar Organismos específicos de la página */}
          {children}
        </div>
      </main>

    </div>
  );
}