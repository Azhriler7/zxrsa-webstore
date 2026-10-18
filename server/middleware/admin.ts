export default defineEventHandler(async (event) => {
  // Hanya proteksi endpoint di bawah /api/admin
  if (!event.path.startsWith('/api/admin')) return

  // FIX PENTING: Jangan blokir endpoint login/logout (/api/admin/auth/*)
  if (event.path.startsWith('/api/admin/auth')) return

  const session = await requireUserSession(event)

  if ((session.user as { role?: string })?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Akses ditolak. Khusus Admin.' })
  }
})
