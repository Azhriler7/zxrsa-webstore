export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/admin')) return

  const session = await requireUserSession(event)

  // Setelah types/auth.d.ts dibuat, 'role' sudah dikenal TypeScript
  if ((session.user as { role?: string }).role !== 'admin')
    throw createError({ statusCode: 403, message: 'Akses ditolak.' })
})
