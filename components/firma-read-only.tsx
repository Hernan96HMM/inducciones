import type { Firma } from '@prisma/client'

const ROL_LABEL: Record<string, string> = {
  hygiene:  'Higiene & Seguridad',
  calidad:  'Gestión de Calidad',
  encargado: 'Encargado / Gerente',
  rrhh:     'RRHH',
}

interface FirmaReadOnlyProps {
  firma: Pick<Firma, 'rol_firmante' | 'nombre_firmante' | 'firma_svg' | 'timestamp'>
}

export default function FirmaReadOnly({ firma }: FirmaReadOnlyProps) {
  const svgBase64 = Buffer.from(firma.firma_svg).toString('base64')
  const fecha = new Date(firma.timestamp).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'rgba(16,185,129,0.05)',
        border: '1px solid rgba(16,185,129,0.25)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#10b981' }}
        >
          ✓ {ROL_LABEL[firma.rol_firmante] ?? firma.rol_firmante}
        </span>
        <span className="text-xs" style={{ color: 'var(--sica-muted)' }}>
          — {firma.nombre_firmante} · {fecha}
        </span>
      </div>

      {/* SVG embebido */}
      <div
        className="rounded-md overflow-hidden"
        style={{ background: '#fff', maxWidth: 320, height: 80 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/svg+xml;base64,${svgBase64}`}
          alt={`Firma de ${firma.nombre_firmante}`}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}
