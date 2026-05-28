import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-helpers'
import { publish } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(['encargado'])
  if (error) return error

  const { fecha_evaluacion, continua, justificacion, firma_encargado_svg } = await req.json()

  if (!fecha_evaluacion || continua === undefined || !firma_encargado_svg) {
    return NextResponse.json({ error: 'Campos incompletos' }, { status: 400 })
  }

  const ingreso = await prisma.ingreso.findUnique({ where: { id: params.id } })
  if (!ingreso) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (ingreso.estado !== 'completado') {
    return NextResponse.json({ error: 'Ingreso no está en estado completado' }, { status: 409 })
  }

  await prisma.$transaction([
    prisma.evaluacion.create({
      data: {
        ingreso_id: params.id,
        fecha_evaluacion: new Date(fecha_evaluacion),
        continua,
        justificacion: justificacion ?? null,
        firma_encargado_svg,
      },
    }),
    prisma.ingreso.update({
      where: { id: params.id },
      data: { estado: 'evaluado' },
    }),
    prisma.auditLog.create({
      data: {
        ingreso_id: params.id,
        usuario_id: session!.user.id,
        accion: 'Evaluación registrada',
        detalle: continua ? 'Decisión: CONTINÚA' : 'Decisión: NO CONTINÚA',
      },
    }),
  ])

  await publish(`ingreso:${params.id}`, { type: 'estado_changed', ingresoId: params.id, estado: 'evaluado' })
  await publish('global', { type: 'pendientes_count' })

  return NextResponse.json({ ok: true })
}
