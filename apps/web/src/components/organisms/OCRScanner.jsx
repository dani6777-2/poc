import React from 'react'
import Card from '../atoms/Card'
import Button from '../atoms/Button'
import Badge from '../atoms/Badge'

export default function OCRScanner({ 
  onClose, 
  processing, 
  ocrResult, 
  handleFileUpload, 
  handleBulkIngest, 
  onReset,
  fmt 
}) {
  return (
    <div className="fixed inset-0 bg-primary/95 backdrop-blur-xl flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-300">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        <div className="p-5 md:p-8 border-b border-border-base flex items-center justify-between">
          <h3 className="text-xl font-black text-tx-primary tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple/20 flex items-center justify-center text-lg shadow-lg shadow-purple/10">📸</div> Inteligencia Artificial Visual
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
          {!ocrResult ? (
            <div className="h-72 border-2 border-dashed border-border-base rounded-[2.5rem] flex flex-col items-center justify-center p-6 md:p-12 text-center group hover:border-purple/40 hover:bg-purple/5 transition-all">
              {processing ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-purple/20 animate-pulse flex items-center justify-center border border-purple/40">
                    <div className="w-8 h-8 rounded-full bg-purple border-2 border-primary animate-ping"></div>
                  </div>
                  <p className="text-purple-light font-black uppercase text-xs tracking-[0.3em]">Reduciendo flujo de visión...</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-tx-primary/5 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:bg-purple/20 transition-all">📄</div>
                  <p className="text-tx-secondary font-bold text-sm mb-10 max-w-[320px]">Sube tu boleta comercial para una inyección de datos asistida por Gemini AI</p>
                  <input type="file" onChange={handleFileUpload} id="ocr-upload" hidden accept="image/*" />
                  <label htmlFor="ocr-upload">
                    <Button variant="primary" as="label" className="cursor-pointer">Seleccionar Archivo</Button>
                  </label>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-tx-primary/5 p-5 rounded-2xl">
                <Badge variant="purple" glow>Detección Completada</Badge>
                <span className="text-xs font-black text-tx-secondary">{ocrResult.length} Activos encontrados</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-tx-muted opacity-40">
                    <th className="pb-4">Activo</th>
                    <th className="pb-4 text-center">Vol</th>
                    <th className="pb-4 text-right">Val. Unitario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {ocrResult.map((it, i) => (
                    <tr key={i}>
                      <td className="py-4 font-bold text-sm text-tx-primary">{it.name}</td>
                      <td className="py-4 text-center tabular-nums text-sm font-bold text-tx-secondary">{it.quantity}</td>
                      <td className="py-4 text-right tabular-nums text-sm font-black text-yellow-light">{fmt(it.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-4 pt-6 mt-4 border-t border-border-base">
                <Button className="flex-1 py-5" onClick={handleBulkIngest} disabled={processing}>
                  {processing ? 'Inyectando Streams...' : 'Incorporar Todo al Registro'}
                </Button>
                <Button variant="ghost" onClick={onReset}>Recargar</Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
