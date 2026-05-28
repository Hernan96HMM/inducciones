import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Rol } from '@prisma/client'

export async function requireAuth(roles?: Rol[]) {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }), session: null }
  }
  if (roles && !roles.includes(session.user.rol)) {
    return { error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }), session: null }
  }
  return { error: null, session }
}

export const ETAPA1_HYGIENE_ITEMS = [
  { key: 'capacitacion_f003',    label: 'Capacitación en sistema de calidad, seguridad y medio ambiente (F-003 + plan evacuación)' },
  { key: 'recorrido_instalaciones', label: 'Recorrido por las instalaciones' },
  { key: 'presentacion_empresa', label: 'Presentación general de la empresa (Presidente/Gerente general)' },
]

export const ETAPA1_CALIDAD_ITEMS = [
  { key: 'estructura_sector',    label: 'Entrega de estructura del sector' },
  { key: 'puesto_banios_comedor', label: 'Indicar puesto de trabajo, baños y comedor' },
]

export const ETAPA2_ITEMS = [
  { key: 'descripcion_puesto_f001', label: 'Entrega de descripción del puesto (F-001)' },
  { key: 'induccion_referente_f054', label: 'Inducción específica al puesto con empleado referente (F-054)' },
]

export function allKeys(items: { key: string }[]) {
  return items.map((i) => i.key)
}
