import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Rol } from '@prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id     = user.id ?? ''
        token.rol    = (user as { rol: Rol }).rol
        token.nombre = (user as { nombre: string }).nombre
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.rol = token.rol as Rol
        session.user.nombre = token.nombre as string
      }
      return session
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.activo) return null

        const ok = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        )
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          nombre: user.nombre,
          rol: user.rol,
        }
      },
    }),
  ],
})
