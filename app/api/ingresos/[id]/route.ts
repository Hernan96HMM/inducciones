import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(['rrhh', 'hygiene', 'calidad', 'encargado', 'superadmin'])
  if (error) return error

  const ingreso = await prisma.ingreso.findUnique({
    where: { id: params.id },
    include: {
      creator:     { select: { nombre: true, rol: true } },
      encargado:   { select: { nombre: true, rol: true } },
      etapa_items: { orderBy: { etapa: 'asc' } },
      firmas:      { orderBy: { timestamp: 'asc' } },
      evaluacion:  true,
      audit_log:   {
        orderBy: { timestamp: 'asc' },
        include: { usuario: { select: { nombre: true, rol: true } } },
      },
    },
  })

  if (!ingreso) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(ingreso)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth(['rrhh'])
  if (error) return error

  const body = await req.json()
  const { nombre, apellido, fecha_inicio, sector, puesto, encargado_id } = body

  const ingreso = await prisma.ingreso.update({
    where: { id: params.id },
    data: {
      ...(nombre        && { nombre }),
      ...(apellido      && { apellido }),
      ...(fecha_inicio  && { fecha_inicio: new Date(fecha_inicio) }),
      ...(sector        && { sector }),
      ...(puesto        && { puesto }),
      ...(encargado_id  && { encargado_id }),
    },
  })

  await prisma.auditLog.create({
    data: {
      ingreso_id: params.id,
      usuario_id: session!.user.id,
      accion: 'Datos actualizados',
    },
  })

  return NextResponse.json(ingreso)
}
