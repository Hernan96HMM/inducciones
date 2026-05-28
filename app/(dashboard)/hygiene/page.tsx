import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import StatusBadge from '@/components/status-badge'

async function getIngresosPendientes() {
  return prisma.ingreso.findMany({
    where: { estado: 'etapa1_pendiente' },
    orderBy: { created_at: 'desc' },
    include: { encargado: { select: { nombre: true } } },
  })
}

export default async function HygieneListPage() {
  const session = await auth()
  if (session?.user.rol !== 'hygiene' && session?.user.rol !== 'superadmin') redirect('/login')

  const ingresos = await getIngresosPendientes()

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}
          >
            Higiene &amp; Seguridad
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sica-muted)' }}>
            Ingresos pendientes de firma — Etapa 1
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(26,154,214,0.1)', border: '1px solid rgba(26,154,214,0.2)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--sica-blue)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--sica-blue)' }}>
            {ingresos.length} pendiente{ingresos.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

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
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center" style={{ color: 'var(--sica-muted)' }}>
                    Sin ingresos pendientes de firma.
                  </td>
                </tr>
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
                  <td
                    className="px-4 py-3 whitespace-nowrap"
                    style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
                  >
                    {new Date(ing.fecha_inicio).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3"><StatusBadge estado={ing.estado} /></td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/hygiene/${ing.id}`}
                      className="text-xs font-semibold"
                      style={{ color: 'var(--sica-blue)' }}
                    >
                      Firmar →
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
