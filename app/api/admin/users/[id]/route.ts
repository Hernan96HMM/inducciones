import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-helpers'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(['superadmin'])
  if (error) return error

  const { nombre, rol, activo, password } = await req.json()

  const data: Record<string, unknown> = {}
  if (nombre   !== undefined) data.nombre = nombre
  if (rol      !== undefined) data.rol    = rol
  if (activo   !== undefined) data.activo = activo
  if (password)               data.password_hash = await bcrypt.hash(password, 12)

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, nombre: true, rol: true, activo: true },
  })
  return NextResponse.json(user)
}
