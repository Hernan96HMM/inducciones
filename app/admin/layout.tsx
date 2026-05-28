import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Settings, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user.rol !== 'superadmin') redirect('/login')

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--sica-dark)' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: 'var(--sica-navy)', borderRight: '1px solid rgba(138,155,190,0.15)' }}>
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(138,155,190,0.15)' }}>
          <Image src="/brand/Sica logo.png" alt="SICA" width={32} height={32} className="object-contain" />
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--sica-white)', fontFamily: 'Barlow Condensed, sans-serif' }}>SICA Admin</p>
            <p className="text-xs" style={{ color: 'var(--sica-muted)' }}>{session.user.email}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          <NavLink href="/admin/usuarios" icon={<Users size={15} />} label="Usuarios" />
          <NavLink href="/admin/configuracion" icon={<Settings size={15} />} label="Configuración" />
        </nav>
        <form action={async () => { 'use server'; redirect('/login') }} className="p-3">
          <Link href="/login" className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg w-full" style={{ color: 'var(--sica-muted)' }}>
            <LogOut size={14} /> Salir
          </Link>
        </form>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: 'var(--sica-muted)' }}>
      {icon} {label}
    </Link>
  )
}
