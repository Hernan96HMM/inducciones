import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Rol } from '@prisma/client'

const ROLE_ROUTES: Record<string, Rol[]> = {
  '/dashboard':       ['rrhh'],
  '/ingresos':        ['rrhh'],
  '/detalle':         ['rrhh'],
  '/hygiene':         ['hygiene'],
  '/calidad':         ['calidad'],
  '/evaluacion':      ['encargado'],
  '/admin':           ['superadmin'],
}

export default auth((req) => {
  const { nextUrl, auth: session } = req as typeof req & { auth: { user?: { rol: Rol } } | null }
  const pathname = nextUrl.pathname

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname === '/api/health') {
    return NextResponse.next()
  }

  // Not authenticated → login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const rol = session.user.rol

  // Check role access
  for (const [prefix, allowed] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      if (!allowed.includes(rol)) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      break
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brand).*)'],
}
