import { eq }            from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id   = getRouterParam(event, 'id')!
  const body = await readBody<{
    name?: string; description?: string; image?: string
    promoBadge?: string; isActive?: boolean
  }>(event)

  // Whitelist: hanya field yang diizinkan
  const safeData: Record<string, unknown> = {}
  if (body.name        !== undefined) safeData.name        = body.name
  if (body.description !== undefined) safeData.description = body.description
  if (body.image       !== undefined) safeData.image       = body.image
  if (body.promoBadge  !== undefined) safeData.promoBadge  = body.promoBadge
  if (body.isActive    !== undefined) safeData.isActive    = body.isActive

  if (Object.keys(safeData).length === 0)
    throw createError({ statusCode: 400, message: 'Tidak ada field yang diupdate.' })

  await db.update(schema.products).set(safeData).where(eq(schema.products.id, id))
  return { ok: true }
})
