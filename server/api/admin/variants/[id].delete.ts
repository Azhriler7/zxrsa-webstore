import { eq }            from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await db.delete(schema.productVariants).where(eq(schema.productVariants.id, id))
  return { ok: true }
})

