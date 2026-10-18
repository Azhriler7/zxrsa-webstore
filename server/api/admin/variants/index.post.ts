export default defineEventHandler(async (event) => {
  const body = await readBody<{
    id: string; productId: string; duration: string; price: number
    promoPrice?: number; promoDayOfWeek?: string; promoSpecificDate?: string
    isCustomGmail: boolean
  }>(event)

  await db.insert(schema.productVariants).values({
    id:                body.id,
    productId:         body.productId,
    duration:          body.duration,
    price:             body.price,
    promoPrice:        body.promoPrice        ?? null,
    promoDayOfWeek:    body.promoDayOfWeek    as any ?? null,
    promoSpecificDate: body.promoSpecificDate ?? null,
    isCustomGmail:     body.isCustomGmail,
  })

  return { ok: true }
})