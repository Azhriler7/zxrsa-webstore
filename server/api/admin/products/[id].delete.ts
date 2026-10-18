import { eq }            from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await db.delete(schema.products).where(eq(schema.products.id, id))
  return { ok: true }
})
