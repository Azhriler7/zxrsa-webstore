// FILE: server/api/admin/auth/login.post.ts
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody<{ email: string; password: string }>(event)

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  })

  if (!user || user.role !== 'admin')
    throw createError({ statusCode: 401, message: 'Email atau password salah.' })

  // PENTING: Urutan parameter bawaan nuxt-auth-utils adalah (hashDiDatabase, passwordInput)
  const isPasswordValid = await verifyPassword(user.password, password)
  if (!isPasswordValid)
    throw createError({ statusCode: 401, message: 'Email atau password salah.' })

  await setUserSession(event, {
    user: { id: user.id, email: user.email, role: user.role },
  })

  return { ok: true }
})