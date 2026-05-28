import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, ETAPA1_HYGIENE_ITEMS, ETAPA1_CALIDAD_ITEMS, ETAPA2_ITEMS, allKeys } from '@/lib/api-helpers'
import { notifyRol, ingresoNotificationHtml } from '@/lib/email'
import { publish } from '@/lib/redis'
import type { Estado } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(['hygiene', 'calidad'])
  if (error) return error

  const { firma_svg, items_completados } = await req.json() as {
    firma_svg: string
    items_completados: string[]
  }

  if (!firma_svg || !Array.isArray(items_completados)) {
    return NextResponse.json({ error: 'firma_svg y items_completados requeridos' }, { status: 400 })
  }

  const ingreso = await prisma.ingreso.findUnique({
    where: { id: params.id },
    include: { etapa_items: true },
  })
  if (!ingreso) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const rol = session!.user.rol

  // Validate state transition
  if (rol === 'hygiene' && ingreso.estado !== 'etapa1_pendiente') {
    return NextResponse.json({ error: 'Estado inválido para firma H&S' }, { status: 409 })
  }
  if (rol === 'calidad' && ingreso.estado !== 'etapa2_pendiente') {
    return NextResponse.json({ error: 'Estado inválido para firma Calidad' }, { status: 409 })
  }

  // Validate all required items are completed
  const requiredKeys = rol === 'hygiene'
    ? allKeys(ETAPA1_HYGIENE_ITEMS)
    : [...allKeys(ETAPA1_CALIDAD_ITEMS), ...allKeys(ETAPA2_ITEMS)]

  const missing = requiredKeys.filter((k) => !items_completados.includes(k))
  if (missing.length > 0) {
    return NextResponse.json({ error: `Items faltantes: ${missing.join(', ')}` }, { status: 400 })
  }

  const nuevoEstado: Estado = rol === 'hygiene' ? 'etapa2_pendiente' : 'completado'
  const now = new Date()

  await prisma.$transaction([
    // Mark items completed
    ...items_completados.map((key) =>
      prisma.etapaItem.updateMany({
        where: { ingreso_id: params.id, item_key: key },
        data: { completado: true, fecha_completado: now, responsable_id: session!.user.id },
      })
    ),
    // Save firma
    prisma.firma.create({
      data: {
        ingreso_id: params.id,
        rol_firmante: rol,
        nombre_firmante: session!.user.nombre,
        firma_svg,
      },
    }),
    // Advance state
    prisma.ingreso.update({
      where: { id: params.id },
      data: { estado: nuevoEstado },
    }),
    // Audit
    prisma.auditLog.create({
      data: {
        ingreso_id: params.id,
        usuario_id: session!.user.id,
        accion: rol === 'hygiene' ? 'Firma H&S registrada' : 'Firma Calidad registrada',
        detalle: `Estado → ${nuevoEstado}`,
      },
    }),
  ])

  // Notifications
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  if (rol === 'hygiene') {
    await notifyRol('calidad', `Inducción lista para Calidad: ${ingreso.apellido}, ${ingreso.nombre}`,
      ingresoNotificationHtml('Firma H&S completada — su turno', ingreso.nombre, ingreso.apellido, appUrl, params.id))
  } else {
    await notifyRol('rrhh', `Inducción completada: ${ingreso.apellido}, ${ingreso.nombre}`,
      ingresoNotificationHtml('Inducción lista para exportar PDF', ingreso.nombre, ingreso.apellido, appUrl, params.id))
  }

  // Real-time push
  await publish(`ingreso:${params.id}`, { type: 'estado_changed', ingresoId: params.id, estado: nuevoEstado })
  await publish('global', { type: 'pendientes_count' })

  return NextResponse.json({ ok: true, estado: nuevoEstado })
}
