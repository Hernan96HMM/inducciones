import puppeteer from 'puppeteer'
import type { Ingreso, EtapaItem, Firma, Evaluacion, User } from '@prisma/client'
import { ETAPA1_HYGIENE_ITEMS, ETAPA1_CALIDAD_ITEMS, ETAPA2_ITEMS } from '@/lib/api-helpers'

type IngresoCompleto = Ingreso & {
  encargado:   Pick<User, 'nombre'>
  etapa_items: EtapaItem[]
  firmas:      Firma[]
  evaluacion:  Evaluacion | null
}

function svgToBase64(svg: string): string {
  return Buffer.from(svg).toString('base64')
}

function formatFecha(d: Date | string): string {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function firmaImg(svg: string, w = 120, h = 40): string {
  return `<img src="data:image/svg+xml;base64,${svgToBase64(svg)}" width="${w}" height="${h}" style="display:block"/>`
}

function itemRow(label: string, sector: string, fecha: string | null, firmaSvg: string | null): string {
  return `
    <tr>
      <td style="padding:6px 8px;border:1px solid #ccc;font-size:10px">${label}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;font-size:10px;white-space:nowrap">${sector}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;font-size:10px;white-space:nowrap">${fecha ?? ''}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;min-width:130px">
        ${firmaSvg ? firmaImg(firmaSvg) : ''}
      </td>
    </tr>`
}

export function buildHtml(ingreso: IngresoCompleto, logoBase64: string): string {
  const firmaHyg  = ingreso.firmas.find((f) => f.rol_firmante === 'hygiene')
  const firmaCal  = ingreso.firmas.find((f) => f.rol_firmante === 'calidad')

  function itemDone(key: string) {
    return ingreso.etapa_items.find((i) => i.item_key === key)
  }

  const hyg1Rows = ETAPA1_HYGIENE_ITEMS.map((item) => {
    const done = itemDone(item.key)
    return itemRow(
      item.label,
      'G. Calidad y Seguridad &amp; S.O.',
      done?.fecha_completado ? formatFecha(done.fecha_completado) : null,
      done?.completado && firmaHyg ? firmaHyg.firma_svg : null
    )
  }).join('')

  const cal1Rows = ETAPA1_CALIDAD_ITEMS.map((item) => {
    const done = itemDone(item.key)
    return itemRow(
      item.label,
      'RR.HH.',
      done?.fecha_completado ? formatFecha(done.fecha_completado) : null,
      done?.completado && firmaCal ? firmaCal.firma_svg : null
    )
  }).join('')

  const etapa2Rows = ETAPA2_ITEMS.map((item) => {
    const done = itemDone(item.key)
    return itemRow(
      item.label,
      ingreso.sector,
      done?.fecha_completado ? formatFecha(done.fecha_completado) : null,
      done?.completado && firmaCal ? firmaCal.firma_svg : null
    )
  }).join('')

  const ev = ingreso.evaluacion

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; }
  h1 { font-size: 14px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #2E4272; color: #fff; padding: 6px 8px; font-size: 10px; text-align: left; border: 1px solid #2E4272; }
  td { vertical-align: top; }
  .section-title { font-weight: bold; font-size: 10px; background: #f0f0f0; padding: 4px 8px; border: 1px solid #ccc; }
  .footer-line { border-top: 1px dashed #555; margin-top: 32px; padding-top: 8px; display: flex; justify-content: space-between; }
  .code { font-family: 'Courier New', monospace; font-size: 9px; color: #555; }
</style>
</head>
<body style="padding: 28px;">

<!-- HEADER -->
<table style="margin-bottom:16px">
  <tr>
    <td style="width:33%">
      <img src="data:image/png;base64,${logoBase64}" height="48" alt="SICA"/>
    </td>
    <td style="width:34%;text-align:center;vertical-align:middle">
      <h1>Programa de Inducción</h1>
    </td>
    <td style="width:33%;text-align:right;vertical-align:top">
      <span class="code">F-003</span>
    </td>
  </tr>
</table>

<!-- DATOS INGRESANTE -->
<table>
  <tr>
    <td style="padding:6px 8px;border:1px solid #ccc;width:50%">
      <strong>Nombre y Apellido:</strong><br/>
      ${ingreso.apellido}, ${ingreso.nombre}
    </td>
    <td style="padding:6px 8px;border:1px solid #ccc;width:50%">
      <strong>Firma del ingresante:</strong><br/>
      <div style="height:32px"></div>
    </td>
  </tr>
  <tr>
    <td style="padding:6px 8px;border:1px solid #ccc">
      <strong>Fecha de inicio:</strong> ${formatFecha(ingreso.fecha_inicio)}
    </td>
    <td style="padding:6px 8px;border:1px solid #ccc">
      <strong>Sector:</strong> ${ingreso.sector}
    </td>
  </tr>
  <tr>
    <td style="padding:6px 8px;border:1px solid #ccc">
      <strong>Puesto:</strong> ${ingreso.puesto}
    </td>
    <td style="padding:6px 8px;border:1px solid #ccc">
      <strong>Encargado/Gerente:</strong> ${ingreso.encargado.nombre}
    </td>
  </tr>
</table>

<!-- REGISTRO DE INDUCCIÓN -->
<table>
  <thead>
    <tr>
      <th style="width:45%">Registro de Inducción</th>
      <th style="width:20%">Sector</th>
      <th style="width:15%">Fecha</th>
      <th style="width:20%">Firma del responsable</th>
    </tr>
  </thead>
  <tbody>
    <tr><td colspan="4" class="section-title">ETAPA 1 — Capacitación General (H&amp;S)</td></tr>
    ${hyg1Rows}
    <tr><td colspan="4" class="section-title">ETAPA 1 — Capacitación General (Calidad)</td></tr>
    ${cal1Rows}
    <tr><td colspan="4" class="section-title">ETAPA 2 — Puesto de Trabajo</td></tr>
    ${etapa2Rows}
    <tr><td colspan="4" class="section-title">ETAPA 3 — Seguimiento y Evaluación</td></tr>
    <tr>
      <td style="padding:6px 8px;border:1px solid #ccc" colspan="2">
        <strong>Fecha evaluación:</strong> ${ev ? formatFecha(ev.fecha_evaluacion) : ''}<br/>
        <strong>Decisión:</strong> ${ev ? (ev.continua ? '✓ CONTINÚA' : '✗ NO CONTINÚA') : ''}<br/>
        ${ev?.justificacion ? `<strong>Justificación:</strong> ${ev.justificacion}` : ''}
      </td>
      <td style="padding:6px 8px;border:1px solid #ccc"></td>
      <td style="padding:6px 8px;border:1px solid #ccc">
        ${ev?.firma_encargado_svg ? firmaImg(ev.firma_encargado_svg) : ''}
      </td>
    </tr>
  </tbody>
</table>

<!-- FOOTER -->
<div class="footer-line">
  <div>
    <div style="border-top:1px dashed #555;width:250px;margin-bottom:4px"></div>
    Fecha y Firma del Ingresante
  </div>
  <span class="code">PGR 6.2.2 – F-003 Rev.10</span>
</div>

</body>
</html>`
}

export async function generatePdf(ingreso: IngresoCompleto, logoPath: string): Promise<Buffer> {
  const fs = await import('fs/promises')
  const logoBuffer = await fs.readFile(logoPath)
  const logoBase64 = logoBuffer.toString('base64')
  const html = buildHtml(ingreso, logoBase64)

  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
      printBackground: true,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
