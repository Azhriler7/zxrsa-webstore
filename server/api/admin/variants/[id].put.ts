import { eq }            from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id   = getRouterParam(event, 'id')!
  const body = await readBody<{
    duration?: string; price?: number; promoPrice?: number
    promoDayOfWeek?: string; promoSpecificDate?: string; isCustomGmail?: boolean
  }>(event)

  const safeData: Record<string, unknown> = {}
  if (body.duration          !== undefined) safeData.duration          = body.duration
  if (body.price             !== undefined) safeData.price             = body.price
  if (body.promoPrice        !== undefined) safeData.promoPrice        = body.promoPrice
  if (body.promoDayOfWeek    !== undefined) safeData.promoDayOfWeek    = body.promoDayOfWeek
  if (body.promoSpecificDate !== undefined) safeData.promoSpecificDate = body.promoSpecificDate
  if (body.isCustomGmail     !== undefined) safeData.isCustomGmail     = body.isCustomGmail

  await db.update(schema.productVariants).set(safeData).where(eq(schema.productVariants.id, id))
  return { ok: true }
})
