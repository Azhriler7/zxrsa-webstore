import { eq }            from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { variantId, rawInput } = await readBody<{ variantId: string; rawInput: string }>(event)

  if (!variantId || !rawInput?.trim())
    throw createError({ statusCode: 400, message: 'variantId dan data stok wajib.' })

  const variant = await db.query.productVariants.findFirst({
    where: eq(schema.productVariants.id, variantId),
  })
  if (!variant)
    throw createError({ statusCode: 404, message: 'Varian tidak ditemukan.' })

  const lines = rawInput
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.includes(':') && l.length > 3)

  if (lines.length === 0)
    throw createError({ statusCode: 400, message: 'Format: email:password (satu baris = satu akun)' })

  await db.insert(schema.accountStocks).values(
    lines.map(accountData => ({ variantId, accountData, isSold: false })),
  )

  return { inserted: lines.length }
})
