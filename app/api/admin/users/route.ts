import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-helpers'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireAuth(['superadmin'])
  if (error) return error

  const users = await prisma.user.findMany({
    select: { id: true, email: true, nombre: true, rol: true, activo: true, created_at: true },
    orderBy: { created_at: 'desc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(['superadmin'])
  if (error) return error

  const { email, nombre, rol, password } = await req.json()
  if (!email || !nombre || !rol || !password) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 })

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, nombre, rol, password_hash: hash },
    select: { id: true, email: true, nombre: true, rol: true, activo: true },
  })
  return NextResponse.json(user, { status: 201 })
}
