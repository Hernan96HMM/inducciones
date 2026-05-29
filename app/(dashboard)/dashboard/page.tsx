import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Users, Clock, CheckCircle, Star } from 'lucide-react'
import BentoMetric from '@/components/bento-metric'
import StatusBadge from '@/components/status-badge'
import type { Estado } from '@prisma/client'

async function getMetrics() {
  const [total, enProceso, completados, evaluados] = await Promise.all([
    prisma.ingreso.count(),
    prisma.ingreso.count({ where: { estado: { in: ['etapa1_pendiente', 'etapa2_pendiente'] } } }),
    prisma.ingreso.count({ where: { estado: 'completado' } }),
    prisma.ingreso.count({ where: { estado: 'evaluado' } }),
  ])
  return { total, enProceso, completados, evaluados }
}

async function getIngresos(sector?: string, estado?: string) {
  return prisma.ingreso.findMany({
    orderBy: { created_at: 'desc' },
    where: {
      ...(sector && { sector }),
      ...(estado && { estado: estado as Estado }),
    },
    include: {
      encargado: { select: { nombre: true } },
    },
    take: 50,
  })
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { sector?: string; estado?: string }
}) {
  const session = await auth()
  if (session?.user.rol !== 'rrhh' && session?.user.rol !== 'superadmin') redirect('/login')

  const [metrics, ingresos] = await Promise.all([
    getMetrics(),
    getIngresos(searchParams.sector, searchParams.estado),
  ])

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}
          >
            Panel de Inducción
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sica-muted)' }}>
            Gestión de ingresos — F-003 PGR 6.2.2
          </p>
        </div>
        <Link href="/ingresos/nuevo" className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
          <Plus size={16} /> Nuevo Ingreso
        </Link>
      </div>

      {/* Bento métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BentoMetric valor={metrics.total}      label="Total"       color="var(--sica-white)" icon={<Users size={20}/>} />
        <BentoMetric valor={metrics.enProceso}  label="En Proceso"  color="#f59e0b"           icon={<Clock size={20}/>} />
        <BentoMetric valor={metrics.completados} label="Completados" color="#10b981"           icon={<CheckCircle size={20}/>} />
        <BentoMetric valor={metrics.evaluados}  label="Evaluados"   color="var(--sica-blue)"  icon={<Star size={20}/>} />
      </div>

      {/* Filtros */}
      <form className="flex gap-3 flex-wrap">
        <select name="estado" defaultValue={searchParams.estado ?? ''} className="input-sica w-auto text-sm px-3 py-2">
          {[
            ['', 'Todos los estados'],
            ['borrador', 'Borrador'],
            ['etapa1_pendiente', 'Pendiente H&S'],
            ['etapa2_pendiente', 'Pendiente Calidad'],
            ['completado', 'Completado'],
            ['evaluado', 'Evaluado'],
          ].map(([v, l]) => (
            <option key={v} value={v} style={{ background: '#1A2A4A', color: '#fff' }}>{l}</option>
          ))}
        </select>
        <input
          name="sector"
          type="text"
          placeholder="Filtrar por sector..."
          defaultValue={searchParams.sector ?? ''}
          className="input-sica w-48 text-sm"
        />
        <button type="submit" className="btn-ghost text-sm px-4 py-2">Filtrar</button>
      </form>

      {/* Tabla */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(46,66,114,0.5)', borderBottom: '1px solid rgba(138,155,190,0.2)' }}>
                {['Apellido y Nombre', 'Sector', 'Puesto', 'Encargado', 'Fecha Inicio', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sica-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingresos.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--sica-muted)' }}>Sin ingresos registrados.</td></tr>
              )}
              {ingresos.map((ing, i) => (
                <tr
                  key={ing.id}
                  style={{ borderBottom: '1px solid rgba(138,155,190,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--sica-white)' }}>
                    {ing.apellido}, {ing.nombre}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--sica-muted)' }}>{ing.sector}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--sica-muted)' }}>{ing.puesto}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--sica-muted)' }}>{ing.encargado.nombre}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                    {new Date(ing.fecha_inicio).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3"><StatusBadge estado={ing.estado} /></td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/detalle/${ing.id}`}
                      className="text-xs font-medium"
                      style={{ color: 'var(--sica-blue)' }}
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
