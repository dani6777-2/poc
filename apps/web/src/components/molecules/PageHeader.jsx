import React from 'react'

export default function PageHeader({ title, subtitle, icon, badge, actions }) {
  return (
    <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 w-full page-entry">
      <div className="flex flex-col">
        {badge && (
          <div className="inline-block text-[9px] font-black bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full mb-4 w-fit tracking-[0.2em] uppercase">
            {badge}
          </div>
        )}
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-12 h-12 rounded-2xl bg-tx-primary/5 flex items-center justify-center text-2xl shadow-xl shadow-black/5 border border-border-base">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-tx-primary m-0 leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-tx-secondary text-[14px] font-medium mt-2 opacity-50 uppercase tracking-widest">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  )
}
