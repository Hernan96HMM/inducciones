import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'
import SSEProvider from '@/components/sse-provider'
import { prisma } from '@/lib/prisma'

async function getPendientes(rol: string, userId: string): Promise<number> {
  if (rol === 'rrhh') {
    return prisma.ingreso.count({ where: { estado: 'completado' } })
  }
  if (rol === 'hygiene') {
    return prisma.ingreso.count({ where: { estado: 'etapa1_pendiente' } })
  }
  if (rol === 'calidad') {
    return prisma.ingreso.count({ where: { estado: 'etapa2_pendiente' } })
  }
  if (rol === 'encargado') {
    return prisma.ingreso.count({
      where: { estado: 'completado', encargado_id: userId },
    })
  }
  return 0
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const pendientes = await getPendientes(session.user.rol, session.user.id)

  return (
    <SSEProvider initialPendientes={pendientes}>
      <div className="min-h-screen" style={{ background: 'var(--sica-dark)' }}>
        <Navbar nombre={session.user.nombre} rol={session.user.rol} />
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </div>
    </SSEProvider>
  )
}
