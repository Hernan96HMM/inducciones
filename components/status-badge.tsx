import type { Estado } from '@prisma/client'

const CONFIG: Record<Estado, { label: string; bg: string; color: string; border: string }> = {
  borrador: {
    label: 'Borrador',
    bg: 'rgba(138,155,190,0.1)',
    color: '#8A9BBE',
    border: 'rgba(138,155,190,0.3)',
  },
  etapa1_pendiente: {
    label: 'Pendiente H&S',
    bg: 'rgba(245,158,11,0.1)',
    color: '#f59e0b',
    border: 'rgba(245,158,11,0.3)',
  },
  etapa2_pendiente: {
    label: 'Pendiente Calidad',
    bg: 'rgba(26,154,214,0.1)',
    color: '#1A9AD6',
    border: 'rgba(26,154,214,0.3)',
  },
  completado: {
    label: 'Completado',
    bg: 'rgba(16,185,129,0.1)',
    color: '#10b981',
    border: 'rgba(16,185,129,0.3)',
  },
  evaluado: {
    label: 'Evaluado',
    bg: 'rgba(46,66,114,0.3)',
    color: '#8A9BBE',
    border: 'rgba(26,154,214,0.4)',
  },
}

export default function StatusBadge({ estado }: { estado: Estado }) {
  const c = CONFIG[estado]
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  )
}
