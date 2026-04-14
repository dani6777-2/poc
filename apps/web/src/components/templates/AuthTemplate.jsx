import React from 'react';

export default function AuthTemplate({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-base text-tx-secondary overflow-hidden fixed inset-0">
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-success/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Contenedor Principal */}
      <div className="relative z-10 w-full max-w-md backdrop-blur-3xl bg-bg-surface/60 border border-white border-opacity-5 relative shadow-2xl rounded-3xl p-5 md:p-8 lg:p-6 md:p-12 overflow-hidden group hover:border-accent/30 transition-all duration-700">
        
        {/* Luces sutiles en los bordes del contenedor al hacer hover (opcional pero aporta al diseño premium) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

        {/* Encabezado */}
        <div className="text-center mb-10 relative z-20">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-accent to-accent-light rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 mb-6 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          {title && <h1 className="text-3xl font-black text-tx-primary tracking-tight mb-2">{title}</h1>}
          {subtitle && <p className="text-sm text-tx-muted font-medium">{subtitle}</p>}
        </div>

        {/* Formulario inyectado (Molecula/Organismo) */}
        <div className="relative z-20">
          {children}
        </div>

      </div>
    </div>
  );
}