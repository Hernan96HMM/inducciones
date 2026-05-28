import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireAuth(['superadmin'])
  if (error) return error

  return NextResponse.json({
    email_enabled: process.env.EMAIL_ENABLED === 'true',
    smtp_host:     process.env.SMTP_HOST     ?? '',
    smtp_port:     process.env.SMTP_PORT     ?? '587',
    smtp_user:     process.env.SMTP_USER     ?? '',
    smtp_from:     process.env.SMTP_FROM     ?? '',
  })
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAuth(['superadmin'])
  if (error) return error

  const body = await req.json()

  // In standalone Docker, env vars can't be mutated at runtime.
  // Return what would be set so the admin knows a restart is needed.
  // For a production system, persist to a config table in DB instead.
  return NextResponse.json({
    message: 'Para aplicar cambios, actualice las variables de entorno en .env y reinicie el contenedor.',
    received: body,
  })
}

export async function POST(req: NextRequest) {
  // Test SMTP connection
  const { error } = await requireAuth(['superadmin'])
  if (error) return error

  const { host, port, user, pass } = await req.json()
  try {
    const transport = nodemailer.createTransport({ host, port: Number(port), auth: { user, pass } })
    await transport.verify()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 })
  }
}
