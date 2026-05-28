'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react'

const STEPS = ['Datos Personales', 'Puesto', 'Encargado']

export default function NuevoIngresoPage() {
  const router = useRouter()
  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const [form, setForm] = useState({
    nombre: '', apellido: '', fecha_inicio: '',
    sector: '', puesto: '',
    encargado_id: '',
  })
  const [encargados, setEncargados] = useState<{ id: string; nombre: string }[]>([])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function loadEncargados() {
    if (encargados.length) return
    const res = await fetch('/api/admin/users?rol=encargado')
    if (res.ok) {
      const data = await res.json()
      setEncargados(data.filter((u: { rol: string }) => u.rol === 'encargado' || u.rol === 'rrhh'))
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Error al crear ingreso')
        return
      }
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-3xl font-bold mb-2"
        style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}
      >
        Nuevo Ingreso
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--sica-muted)' }}>Registro de inducción F-003</p>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                style={{
                  background: i < step ? '#10b981' : i === step ? 'var(--sica-blue)' : 'rgba(138,155,190,0.2)',
                  color: '#fff',
                }}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-xs hidden sm:block" style={{ color: i === step ? 'var(--sica-white)' : 'var(--sica-muted)' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 mx-2" style={{ background: 'rgba(138,155,190,0.2)' }} />
            )}
          </div>
        ))}
      </div>

      <div className="card-glass p-6 flex flex-col gap-5">
        {/* Paso 0: Datos personales */}
        {step === 0 && (
          <>
            <Field label="Nombre" value={form.nombre} onChange={(v) => set('nombre', v)} placeholder="Juan Pablo" />
            <Field label="Apellido" value={form.apellido} onChange={(v) => set('apellido', v)} placeholder="García" />
            <Field label="Fecha de inicio" value={form.fecha_inicio} onChange={(v) => set('fecha_inicio', v)} type="date" />
          </>
        )}

        {/* Paso 1: Puesto */}
        {step === 1 && (
          <>
            <Field label="Sector" value={form.sector} onChange={(v) => set('sector', v)} placeholder="Ej: Mantenimiento" />
            <Field label="Puesto" value={form.puesto} onChange={(v) => set('puesto', v)} placeholder="Ej: Técnico Electricista" />
          </>
        )}

        {/* Paso 2: Encargado */}
        {step === 2 && (
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--sica-muted)' }}>
              Encargado / Gerente
            </label>
            <select
              className="input-sica"
              value={form.encargado_id}
              onChange={(e) => set('encargado_id', e.target.value)}
              onClick={loadEncargados}
            >
              <option value="">Seleccionar...</option>
              {encargados.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </p>
        )}

        {/* Navegación */}
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="btn-ghost flex items-center gap-1 text-sm px-4 py-2"
          >
            <ChevronLeft size={14} /> Anterior
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="btn-primary flex items-center gap-1 text-sm px-4 py-2"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !form.encargado_id}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Crear Ingreso
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--sica-muted)' }}>{label}</label>
      <input
        type={type}
        className="input-sica"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
