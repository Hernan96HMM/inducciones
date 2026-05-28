'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

const ROLE_REDIRECT: Record<string, string> = {
  superadmin: '/admin/usuarios',
  rrhh:       '/dashboard',
  hygiene:    '/dashboard',
  calidad:    '/dashboard',
  encargado:  '/dashboard',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Fetch session to get role for redirect
    const sessionRes = await fetch('/api/auth/session')
    const session = await sessionRes.json()
    const rol = session?.user?.rol ?? 'rrhh'
    router.push(ROLE_REDIRECT[rol] ?? '/dashboard')
  }

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center p-4">
      {/* Grid técnico de fondo */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(var(--sica-blue) 1px, transparent 1px), linear-gradient(90deg, var(--sica-blue) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="card-glass p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/brand/logo-footer-1.png"
              alt="SICA"
              width={200}
              height={60}
              className="object-contain"
              priority
            />
          </div>

          {/* Headline animado */}
          <h1
            className="shimmer-text text-center text-2xl font-bold mb-1"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            Sistema de Inducción
          </h1>
          <p className="text-center text-xs mb-8" style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            F-003 PGR 6.2.2 — Industria para la Energía
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--sica-muted)' }}>
                Email
              </label>
              <input
                type="email"
                className="input-sica"
                placeholder="usuario@sica.com.ar"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--sica-muted)' }}>
                Contraseña
              </label>
              <input
                type="password"
                className="input-sica"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-center py-2 px-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full mt-2 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Ingresando...</> : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: 'var(--sica-muted)' }}>
          SICA © {new Date().getFullYear()} — Acceso restringido al personal autorizado
        </p>
      </div>
    </div>
  )
}
