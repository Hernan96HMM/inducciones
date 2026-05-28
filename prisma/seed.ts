import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@sica.com.ar'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Superadmin ya existe:', email)
    return
  }

  const hash = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: {
      email,
      password_hash: hash,
      nombre: 'Administrador',
      rol: 'superadmin',
    },
  })
  console.log('Superadmin creado:', email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
