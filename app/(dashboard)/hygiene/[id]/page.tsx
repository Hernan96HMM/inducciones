'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import FirmaCanvas from '@/components/firma-canvas'
import ChecklistItem from '@/components/checklist-item'
import StatusBadge from '@/components/status-badge'
import { ETAPA1_HYGIENE_ITEMS } from '@/lib/api-helpers'
import type { Ingreso } from '@prisma/client'

export default function HygienePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [ingreso, setIngreso]           = useState<Ingreso | null>(null)
  const [checked, setChecked]           = useState<Record<string, boolean>>({})
  const [firmaSvg, setFirmaSvg]         = useState('')
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    fetch(`/api/ingresos/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setIngreso(data)
        const init: Record<string, boolean> = {}
        ETAPA1_HYGIENE_ITEMS.forEach((item) => {
          const found = data.etapa_items?.find((i: { item_key: string; completado: boolean }) => i.item_key === item.key)
          init[item.key] = found?.completado ?? false
        })
        setChecked(init)
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const allChecked = ETAPA1_HYGIENE_ITEMS.every((i) => checked[i.key])
  const canSign    = allChecked && firmaSvg.length > 0

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/firmas/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firma_svg: firmaSvg,
          items_completados: ETAPA1_HYGIENE_ITEMS.filter((i) => checked[i.key]).map((i) => i.key),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Error al firmar')
        return
      }
      router.push('/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="card-glass p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}>
              {ingreso?.apellido}, {ingreso?.nombre}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--sica-muted)' }}>
              {ingreso?.sector} · {ingreso?.puesto}
            </p>
          </div>
          {ingreso && <StatusBadge estado={ingreso.estado} />}
        </div>
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          Checklist Etapa 1 — H&S
        </h2>
        {ETAPA1_HYGIENE_ITEMS.map((item) => (
          <ChecklistItem
            key={item.key}
            label={item.label}
            checked={checked[item.key] ?? false}
            onChange={(v) => setChecked((c) => ({ ...c, [item.key]: v }))}
            disabled={ingreso?.estado !== 'etapa1_pendiente'}
          />
        ))}
      </div>

      {/* Firma */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          Firma Responsable H&S
        </h2>
        <FirmaCanvas onCapture={setFirmaSvg} />
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSign || submitting || ingreso?.estado !== 'etapa1_pendiente'}
        className="btn-primary flex items-center justify-center gap-2 py-3 text-sm"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Firmar y Enviar a Calidad
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center items-center h-48">
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--sica-blue)' }} />
    </div>
  )
}
