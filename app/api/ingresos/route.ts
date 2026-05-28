import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, ETAPA1_HYGIENE_ITEMS, ETAPA1_CALIDAD_ITEMS, ETAPA2_ITEMS } from '@/lib/api-helpers'
import { notifyRol, ingresoNotificationHtml } from '@/lib/email'
import { publish } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error, session } = await requireAuth(['rrhh', 'superadmin'])
  if (error) return error

  const ingresos = await prisma.ingreso.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      creator:   { select: { nombre: true } },
      encargado: { select: { nombre: true } },
      firmas:    { select: { rol_firmante: true, timestamp: true } },
    },
  })

  return NextResponse.json(ingresos)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(['rrhh'])
  if (error) return error

  const body = await req.json()
  const { nombre, apellido, fecha_inicio, sector, puesto, encargado_id } = body

  if (!nombre || !apellido || !fecha_inicio || !sector || !puesto || !encargado_id) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const ingreso = await prisma.ingreso.create({
    data: {
      nombre,
      apellido,
      fecha_inicio: new Date(fecha_inicio),
      sector,
      puesto,
      encargado_id,
      created_by: session!.user.id,
      estado: 'etapa1_pendiente',
      etapa_items: {
        create: [
          ...ETAPA1_HYGIENE_ITEMS.map((i) => ({ etapa: 1, item_key: i.key })),
          ...ETAPA1_CALIDAD_ITEMS.map((i) => ({ etapa: 1, item_key: i.key })),
          ...ETAPA2_ITEMS.map((i)         => ({ etapa: 2, item_key: i.key })),
        ],
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      ingreso_id: ingreso.id,
      usuario_id: session!.user.id,
      accion: 'Ingreso creado',
      detalle: `${apellido}, ${nombre} — ${sector}`,
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  await notifyRol(
    'hygiene',
    `Nuevo ingreso: ${apellido}, ${nombre}`,
    ingresoNotificationHtml('Nuevo ingreso para inducción', nombre, apellido, appUrl, ingreso.id)
  )

  await publish('global', { type: 'pendientes_count' })

  return NextResponse.json(ingreso, { status: 201 })
}
