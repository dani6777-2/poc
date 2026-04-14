import React from 'react'
import Card from '../atoms/Card'
import Button from '../atoms/Button'

export default function ConfirmModal({ mensaje, onConfirm, onCancel, type = 'danger' }) {
  return (
    <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-200" onClick={e => e.target === e.currentTarget && onCancel()}>
      <Card className="max-w-[400px] w-full p-5 md:p-8 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black text-tx-primary mb-4 flex items-center gap-2">
          <span className={type === 'danger' ? 'text-danger' : 'text-warning'}>{type === 'danger' ? '🗑️' : '⚠️'}</span> Confirmar Acción
        </h3>
        <p className="text-tx-secondary text-[15px] font-medium leading-relaxed mb-8">{mensaje}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button variant={type} onClick={onConfirm} autoFocus>
            {type === 'danger' ? 'Eliminar' : 'Confirmar'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
