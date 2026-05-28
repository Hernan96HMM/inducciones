'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import FirmaCanvas from '@/components/firma-canvas'
import StatusBadge from '@/components/status-badge'
import type { Ingreso } from '@prisma/client'

export default function EvaluacionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [ingreso, setIngreso]       = useState<Ingreso | null>(null)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [firmaSvg, setFirmaSvg]     = useState('')
  const [form, setForm] = useState({
    fecha_evaluacion: new Date().toISOString().slice(0, 10),
    continua: true,
    justificacion: '',
  })

  useEffect(() => {
    fetch(`/api/ingresos/${params.id}`)
      .then((r) => r.json())
      .then(setIngreso)
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleSubmit() {
    if (!firmaSvg) { setError('Se requiere firma'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/evaluaciones/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, firma_encargado_svg: firmaSvg }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      router.push('/dashboard')
    } finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex justify-center items-center h-48"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--sica-blue)' }} /></div>

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="card-glass p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}>
              Evaluación — {ingreso?.apellido}, {ingreso?.nombre}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--sica-muted)' }}>Etapa 3 · Fin de período de prueba</p>
          </div>
          {ingreso && <StatusBadge estado={ingreso.estado} />}
        </div>
      </div>

      <div className="card-glass p-6 flex flex-col gap-5">
        {/* Fecha */}
        <div>
          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--sica-muted)' }}>Fecha de evaluación</label>
          <input type="date" className="input-sica" value={form.fecha_evaluacion}
            onChange={(e) => setForm((f) => ({ ...f, fecha_evaluacion: e.target.value }))} />
        </div>

        {/* Toggle SI/NO */}
        <div>
          <label className="block text-xs mb-2 font-medium" style={{ color: 'var(--sica-muted)' }}>Decisión de continuidad</label>
          <div className="flex gap-3">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setForm((f) => ({ ...f, continua: val }))}
                className="flex-1 py-3 rounded-lg font-bold text-sm transition-colors"
                style={{
                  background: form.continua === val
                    ? (val ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)')
                    : 'rgba(255,255,255,0.03)',
                  border: form.continua === val
                    ? `2px solid ${val ? '#10b981' : '#ef4444'}`
                    : '2px solid rgba(138,155,190,0.2)',
                  color: form.continua === val ? (val ? '#10b981' : '#ef4444') : 'var(--sica-muted)',
                }}
              >
                {val ? '✓ CONTINÚA' : '✗ NO CONTINÚA'}
              </button>
            ))}
          </div>
        </div>

        {/* Justificación */}
        <div>
          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--sica-muted)' }}>
            Justificación {form.continua ? '(opcional)' : '(requerida)'}
          </label>
          <textarea
            className="input-sica"
            rows={3}
            value={form.justificacion}
            onChange={(e) => setForm((f) => ({ ...f, justificacion: e.target.value }))}
            placeholder="Observaciones sobre el desempeño del período de prueba..."
          />
        </div>

        {/* Firma */}
        <div className="flex flex-col gap-2">
          <label className="block text-xs font-medium" style={{ color: 'var(--sica-muted)' }}>Firma del Encargado/Gerente</label>
          <FirmaCanvas onCapture={setFirmaSvg} />
        </div>

        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !firmaSvg}
          className="btn-primary flex items-center justify-center gap-2 py-3 text-sm"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Registrar Evaluación
        </button>
      </div>
    </div>
  )
}
