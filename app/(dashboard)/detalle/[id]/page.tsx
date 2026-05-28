import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Download, ArrowLeft } from 'lucide-react'
import StatusBadge from '@/components/status-badge'
import FirmaReadOnly from '@/components/firma-read-only'
import AuditTimeline from '@/components/audit-timeline'
import { ETAPA1_HYGIENE_ITEMS, ETAPA1_CALIDAD_ITEMS, ETAPA2_ITEMS } from '@/lib/api-helpers'

export default async function DetallePage({ params }: { params: { id: string } }) {
  const ingreso = await prisma.ingreso.findUnique({
    where: { id: params.id },
    include: {
      encargado:   { select: { nombre: true } },
      etapa_items: { orderBy: { etapa: 'asc' } },
      firmas:      { orderBy: { timestamp: 'asc' } },
      evaluacion:  true,
      audit_log: {
        orderBy: { timestamp: 'asc' },
        include: { usuario: { select: { nombre: true, rol: true } } },
      },
    },
  })
  if (!ingreso) notFound()

  const firmaHyg = ingreso.firmas.find((f) => f.rol_firmante === 'hygiene')
  const firmaCal = ingreso.firmas.find((f) => f.rol_firmante === 'calidad')
  const canExport = ingreso.estado === 'completado' || ingreso.estado === 'evaluado'

  function itemLabel(key: string) {
    return (
      [...ETAPA1_HYGIENE_ITEMS, ...ETAPA1_CALIDAD_ITEMS, ...ETAPA2_ITEMS].find((i) => i.key === key)?.label ?? key
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Nav */}
      <Link href="/dashboard" className="flex items-center gap-1 text-sm self-start" style={{ color: 'var(--sica-muted)' }}>
        <ArrowLeft size={14} /> Volver al Dashboard
      </Link>

      {/* Header */}
      <div className="card-glass p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}>
              {ingreso.apellido}, {ingreso.nombre}
            </h1>
            <div className="flex gap-4 mt-2 text-sm flex-wrap" style={{ color: 'var(--sica-muted)' }}>
              <span>{ingreso.sector} · {ingreso.puesto}</span>
              <span>Encargado: {ingreso.encargado.nombre}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                Inicio: {new Date(ingreso.fecha_inicio).toLocaleDateString('es-AR')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge estado={ingreso.estado} />
            {canExport && (
              <a
                href={`/api/pdf/${ingreso.id}`}
                className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
              >
                <Download size={14} /> Exportar PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Checklist completo */}
      <div className="card-glass p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          Registro de Inducción
        </h2>
        {ingreso.etapa_items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(138,155,190,0.1)' }}>
            <span
              className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-xs"
              style={{ background: item.completado ? 'rgba(16,185,129,0.2)' : 'rgba(138,155,190,0.1)', color: item.completado ? '#10b981' : 'var(--sica-muted)' }}
            >
              {item.completado ? '✓' : '○'}
            </span>
            <span className="text-sm flex-1" style={{ color: item.completado ? 'var(--sica-muted)' : 'var(--sica-white)' }}>
              {itemLabel(item.item_key)}
            </span>
            {item.fecha_completado && (
              <span className="text-xs" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {new Date(item.fecha_completado).toLocaleDateString('es-AR')}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Firmas */}
      {(firmaHyg || firmaCal) && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            Firmas Registradas
          </h2>
          {firmaHyg && <FirmaReadOnly firma={firmaHyg} />}
          {firmaCal && <FirmaReadOnly firma={firmaCal} />}
        </div>
      )}

      {/* Evaluación */}
      {ingreso.evaluacion && (
        <div className="card-glass p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            Evaluación Final — Etapa 3
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span style={{ color: 'var(--sica-muted)' }}>Fecha:</span>{' '}
              <span style={{ color: 'var(--sica-white)' }}>{new Date(ingreso.evaluacion.fecha_evaluacion).toLocaleDateString('es-AR')}</span>
            </div>
            <div>
              <span style={{ color: 'var(--sica-muted)' }}>Decisión:</span>{' '}
              <span style={{ color: ingreso.evaluacion.continua ? '#10b981' : '#f87171', fontWeight: 600 }}>
                {ingreso.evaluacion.continua ? '✓ CONTINÚA' : '✗ NO CONTINÚA'}
              </span>
            </div>
            {ingreso.evaluacion.justificacion && (
              <div className="col-span-2">
                <span style={{ color: 'var(--sica-muted)' }}>Justificación:</span>{' '}
                <span style={{ color: 'var(--sica-white)' }}>{ingreso.evaluacion.justificacion}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit log */}
      <div className="card-glass p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          Historial de Actividad
        </h2>
        <AuditTimeline logs={ingreso.audit_log as Parameters<typeof AuditTimeline>[0]['logs']} />
      </div>
    </div>
  )
}
