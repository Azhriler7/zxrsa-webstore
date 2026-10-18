import { eq } from 'drizzle-orm'

export default defineTask({
  meta: { name: 'db:seed-admin', description: 'Buat atau reset akun admin pertama (dev only)' },
  async run() {
    const adminEmail = 'admin@zxrsa.com'
    const hashedPassword = await hashPassword('GantiPasswordIni!')

    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, adminEmail),
    })

    if (existing) {
      // Update password-nya dengan hash yang valid
      await db
        .update(schema.users)
        .set({ password: hashedPassword, role: 'admin' })
        .where(eq(schema.users.email, adminEmail))
      return { result: `Password untuk ${adminEmail} berhasil di-reset!` }
    }

    await db.insert(schema.users).values({
      id:       crypto.randomUUID(),
      email:    adminEmail,
      password: hashedPassword,
      role:     'admin',
    })

    return { result: `Admin ${adminEmail} berhasil dibuat!` }
  },
})