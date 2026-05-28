import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import type { Rol } from '@prisma/client'

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

async function isEmailEnabled(): Promise<boolean> {
  return process.env.EMAIL_ENABLED === 'true'
}

async function getEmailsByRol(rol: Rol): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { rol, activo: true },
    select: { email: true },
  })
  return users.map((u) => u.email)
}

export async function notifyRol(
  rol: Rol,
  subject: string,
  html: string
): Promise<void> {
  if (!(await isEmailEnabled())) return
  if (!process.env.SMTP_HOST) return

  const to = await getEmailsByRol(rol)
  if (to.length === 0) return

  const transport = createTransport()
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'inducciones@sica.com.ar',
    to,
    subject,
    html,
  })
}

export function ingresoNotificationHtml(
  action: string,
  nombre: string,
  apellido: string,
  appUrl: string,
  ingresoId: string
): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#2E4272">SICA — Sistema de Inducción</h2>
      <p>${action}: <strong>${apellido}, ${nombre}</strong></p>
      <p><a href="${appUrl}/detalle/${ingresoId}" style="color:#1A9AD6">Ver formulario →</a></p>
    </div>
  `
}
