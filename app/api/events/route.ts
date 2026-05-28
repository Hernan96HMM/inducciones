import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { redisSub } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import type { Rol } from '@prisma/client'

export const dynamic = 'force-dynamic'

async function getPendientes(rol: Rol, userId: string): Promise<number> {
  if (rol === 'rrhh')      return prisma.ingreso.count({ where: { estado: 'completado' } })
  if (rol === 'hygiene')   return prisma.ingreso.count({ where: { estado: 'etapa1_pendiente' } })
  if (rol === 'calidad')   return prisma.ingreso.count({ where: { estado: 'etapa2_pendiente' } })
  if (rol === 'encargado') return prisma.ingreso.count({ where: { estado: 'completado', encargado_id: userId } })
  return 0
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id: userId, rol } = session.user

  const encoder = new TextEncoder()
  const sub = redisSub.duplicate()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { /* client disconnected */ }
      }

      // Send initial pendientes count
      const pendientes = await getPendientes(rol, userId)
      send({ type: 'pendientes_count', pendientes })

      // Subscribe to global + personal channels
      await sub.subscribe('global', `ingreso:*`)

      sub.on('message', async (_channel: string, message: string) => {
        try {
          const data = JSON.parse(message)
          if (data.type === 'pendientes_count') {
            const count = await getPendientes(rol, userId)
            send({ type: 'pendientes_count', pendientes: count })
          } else {
            send(data)
          }
        } catch { /* ignore */ }
      })

      // Keepalive ping every 25s
      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { clearInterval(ping) }
      }, 25_000)

      // Cleanup on close
      return () => {
        clearInterval(ping)
        sub.unsubscribe().catch(() => {})
        sub.disconnect()
      }
    },
    cancel() {
      sub.unsubscribe().catch(() => {})
      sub.disconnect()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
