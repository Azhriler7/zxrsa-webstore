import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'ID stok tidak valid.' })

  await db.delete(schema.accountStocks).where(eq(schema.accountStocks.id, id))
  return { ok: true }
})
