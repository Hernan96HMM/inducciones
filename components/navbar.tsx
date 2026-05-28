'use client'

import Image from 'next/image'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Bell, LogOut, Shield } from 'lucide-react'
import { useSSE } from '@/components/sse-provider'
import type { Rol } from '@prisma/client'

const ROL_LABEL: Record<Rol, string> = {
  superadmin: 'Admin',
  rrhh:       'RRHH',
  hygiene:    'H&S',
  calidad:    'Calidad',
  encargado:  'Encargado',
}

interface NavbarProps {
  nombre: string
  rol: Rol
}

export default function Navbar({ nombre, rol }: NavbarProps) {
  const { pendientes } = useSSE()

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: 'var(--sica-navy)',
        borderBottom: '1px solid rgba(26, 154, 214, 0.4)',
      }}
    >
      {/* Logo + título */}
      <Link href="/dashboard" className="flex items-center gap-3">
        <Image
          src="/brand/Sica logo.png"
          alt="SICA"
          width={36}
          height={36}
          className="object-contain"
        />
        <div>
          <p
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'var(--sica-muted)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            SICA
          </p>
          <p
            className="text-sm font-bold leading-tight"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--sica-white)' }}
          >
            Sistema de Inducción
          </p>
        </div>
      </Link>

      {/* Derecha */}
      <div className="flex items-center gap-4">
        {/* Badge pendientes */}
        {pendientes > 0 && (
          <div className="relative">
            <Bell size={20} style={{ color: 'var(--sica-muted)' }} />
            <span
              className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
              style={{ background: 'var(--sica-blue)', color: '#fff' }}
            >
              {pendientes > 9 ? '9+' : pendientes}
            </span>
          </div>
        )}

        {/* Rol badge */}
        <span
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold"
          style={{
            background: 'rgba(26,154,214,0.15)',
            border: '1px solid rgba(26,154,214,0.35)',
            color: 'var(--sica-blue)',
          }}
        >
          <Shield size={11} />
          {ROL_LABEL[rol]}
        </span>

        {/* Nombre */}
        <span className="text-sm hidden sm:block" style={{ color: 'var(--sica-muted)' }}>
          {nombre}
        </span>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1 text-xs btn-ghost py-1.5 px-3"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </nav>
  )
}
