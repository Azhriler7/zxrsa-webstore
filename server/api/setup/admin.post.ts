// FILE: server/api/setup/admin.post.ts
import { count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const { setupKey, email, password } = await readBody<{
    setupKey: string; email: string; password: string
  }>(event)

  if (!config.setupKey || config.setupKey.length < 16 || setupKey !== config.setupKey)
    throw createError({ statusCode: 403, message: 'Forbidden' })

  const rows  = await db.select({ total: count() }).from(schema.users)
  const total = rows.at(0)?.total ?? 0

  if (total > 0)
    throw createError({ statusCode: 400, message: 'Setup sudah pernah dijalankan.' })

  const hashedPassword = await hashPassword(password)

  await db.insert(schema.users).values({
    id:       crypto.randomUUID(),
    email,
    password: hashedPassword,
    role:     'admin',
  })

  return { ok: true, message: `Admin ${email} dibuat. HAPUS FILE INI SEKARANG!` }
})