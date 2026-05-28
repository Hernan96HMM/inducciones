import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SICA — Sistema de Inducción',
  description: 'Gestión digital de inducción de personal — SICA Industria para la Energía',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
