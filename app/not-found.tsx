import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="mesh-bg min-h-screen flex flex-col items-center justify-center gap-6 text-center p-6">
      <Image src="/brand/Sica logo.png" alt="SICA" width={72} height={72} className="object-contain opacity-60" />

      <p
        className="text-8xl font-bold leading-none"
        style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-navy)' }}
      >
        404
      </p>

      <div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}
        >
          Página no encontrada
        </h1>
        <p className="text-sm" style={{ color: 'var(--sica-muted)' }}>
          La ruta solicitada no existe en este sistema.
        </p>
      </div>

      <Link href="/dashboard" className="btn-primary px-6 py-2.5 text-sm inline-block">
        Volver al Dashboard
      </Link>

      <p
        className="text-xs mt-4"
        style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}
      >
        SICA — Sistema de Inducción
      </p>
    </div>
  )
}
