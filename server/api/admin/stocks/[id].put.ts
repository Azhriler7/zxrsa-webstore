import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ accountData?: string; isSold?: boolean }>(event)
  if (!id) throw createError({ statusCode: 400, message: 'ID stok tidak valid.' })

  const safeData: Record<string, unknown> = {}
  if (body.accountData !== undefined) safeData.accountData = body.accountData.trim()
  if (body.isSold      !== undefined) {
    safeData.isSold = body.isSold
    safeData.soldAt = body.isSold ? new Date().toISOString() : null
  }

  await db.update(schema.accountStocks).set(safeData).where(eq(schema.accountStocks.id, id))
  return { ok: true }
})
