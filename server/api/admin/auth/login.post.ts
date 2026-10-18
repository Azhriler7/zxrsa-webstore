import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body?.email?.trim().toLowerCase() ?? ''
  const password = body?.password ?? ''

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email dan password wajib diisi.' })
  }

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  })

  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 401, message: 'Email atau password salah.' })
  }

  // Urutan parameter nuxt-auth-utils: verifyPassword(hashedPassword, plainPassword)
  const isPasswordValid = await verifyPassword(user.password, password)
  if (!isPasswordValid) {
    throw createError({ statusCode: 401, message: 'Email atau password salah.' })
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, role: user.role },
    loggedInAt: new Date().toISOString(),
  })

  return {
    ok: true,
    user: { id: user.id, email: user.email, role: user.role },
  }
})
