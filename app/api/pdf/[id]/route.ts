import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-helpers'
import { generatePdf } from '@/lib/pdf-generator'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(['rrhh'])
  if (error) return error

  const ingreso = await prisma.ingreso.findUnique({
    where: { id: params.id },
    include: {
      encargado:   { select: { nombre: true } },
      etapa_items: true,
      firmas:      true,
      evaluacion:  true,
    },
  })

  if (!ingreso) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (ingreso.estado !== 'completado' && ingreso.estado !== 'evaluado') {
    return NextResponse.json({ error: 'Inducción no completada' }, { status: 409 })
  }

  const logoPath = path.join(process.cwd(), 'public', 'brand', 'logo-footer-1.png')
  const pdf = await generatePdf(ingreso, logoPath)

  const filename = `F003_${ingreso.apellido}_${ingreso.nombre}_${new Date().toISOString().slice(0, 10)}.pdf`

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
