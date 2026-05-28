import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Rol } from '@prisma/client'

const ROLE_HOME: Record<Rol, string> = {
  superadmin: '/admin',
  rrhh:       '/dashboard',
  hygiene:    '/hygiene',
  calidad:    '/calidad',
  encargado:  '/evaluacion',
}

const ROLE_ROUTES: Record<string, Rol[]> = {
  '/dashboard':  ['rrhh'],
  '/ingresos':   ['rrhh'],
  '/detalle':    ['rrhh'],
  '/hygiene':    ['hygiene'],
  '/calidad':    ['calidad'],
  '/evaluacion': ['encargado'],
  '/admin':      ['superadmin'],
}

export default auth((req) => {
  const { nextUrl, auth: session } = req as typeof req & { auth: { user?: { rol: Rol } } | null }
  const pathname = nextUrl.pathname

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname === '/api/health') {
    return NextResponse.next()
  }

  // SSE route — auth required, no role check
  if (pathname.startsWith('/api/events')) {
    if (!session?.user) return NextResponse.redirect(new URL('/login', req.url))
    return NextResponse.next()
  }

  // Not authenticated → login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const rol = session.user.rol
  const home = ROLE_HOME[rol]

  // Root → role home
  if (pathname === '/') {
    return NextResponse.redirect(new URL(home, req.url))
  }

  // Check role access; unauthorized → role home (not login)
  for (const [prefix, allowed] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      if (!allowed.includes(rol)) {
        return NextResponse.redirect(new URL(home, req.url))
      }
      break
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brand).*)'],
}
