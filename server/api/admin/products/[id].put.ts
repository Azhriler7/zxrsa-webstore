import { eq, notInArray, and, type InferSelectModel } from 'drizzle-orm'
import * as schema from '../../../db/schema'
import { getJakartaDateParts } from '../../../utils/promo'

type VariantRow = InferSelectModel<typeof schema.productVariants>

interface VariantInputPayload {
  id?: string
  duration: string
  price: number
  isActive?: boolean
  isPromoActive?: boolean
  discountAmount?: number | null
  promoPrice?: number | null
  promoStartDate?: string | null
  promoDayOfWeek?: string | null
  promoSpecificDate?: string | null
  promoRepeatYearly?: boolean
  isCustomGmail?: boolean
}

export default defineEventHandler(async (event) => {
  const id   = getRouterParam(event, 'id')!
  const body = await readBody<{
    name?: string
    description?: string | null
    image?: string | null
    promoBadge?: string | null
    rules?: string | null
    isActive?: boolean
    variants?: VariantInputPayload[]
  }>(event)

  const { todayYYYYMMDD } = getJakartaDateParts()

  const safeData: Partial<typeof schema.products.$inferInsert> = {}
  if (body.name        !== undefined) safeData.name        = body.name
  if (body.description !== undefined) safeData.description = body.description
  if (body.image       !== undefined) safeData.image       = body.image
  if (body.promoBadge  !== undefined) safeData.promoBadge  = body.promoBadge
  if (body.rules       !== undefined) safeData.rules       = body.rules
  if (body.isActive    !== undefined) safeData.isActive    = body.isActive

  if (Object.keys(safeData).length > 0) {
    await db.update(schema.products).set(safeData).where(eq(schema.products.id, id))
  }

  if (Array.isArray(body.variants)) {
    const existingVariants = (await db.query.productVariants.findMany({
      where: eq(schema.productVariants.productId, id),
    })) as unknown as VariantRow[]
    const existingMap = new Map<string, VariantRow>(existingVariants.map(v => [v.id, v]))

    const keptIds: string[] = []

    for (let i = 0; i < body.variants.length; i++) {
      const v = body.variants[i]
      if (!v) continue
      const varId = v.id?.trim() || `${id}-pkg-${Date.now()}-${i}`
      const prev = existingMap.get(varId)

      if (
        v.isPromoActive &&
        v.promoStartDate &&
        v.promoStartDate < todayYYYYMMDD &&
        v.promoStartDate !== prev?.promoStartDate
      ) {
        throw createError({
          statusCode: 400,
          message: `Tanggal diskon paket "${v.duration}" tidak boleh sebelum hari ini (${todayYYYYMMDD}).`,
        })
      }

      const disc = v.isPromoActive ? Number(v.discountAmount ?? 0) : 0
      const calcPromoPrice = v.isPromoActive && disc > 0
        ? Math.max(0, Number(v.price) - disc)
        : (v.promoPrice ?? null)
      const mmdd = v.promoStartDate && v.promoStartDate.length >= 10
        ? v.promoStartDate.slice(5, 10)
        : (v.promoSpecificDate || null)

      const rowValues: Omit<typeof schema.productVariants.$inferInsert, 'id' | 'productId'> = {
        duration:          v.duration.trim(),
        price:             Number(v.price),
        isActive:          v.isActive ?? true,
        isPromoActive:     v.isPromoActive ?? false,
        discountAmount:    v.isPromoActive ? disc : null,
        promoPrice:        v.isPromoActive ? calcPromoPrice : null,
        promoStartDate:    v.isPromoActive ? (v.promoStartDate || null) : null,
        promoDayOfWeek:    v.isPromoActive ? (v.promoDayOfWeek || null) : null,
        promoSpecificDate: v.isPromoActive ? mmdd : null,
        promoRepeatYearly: v.isPromoActive ? Boolean(v.promoRepeatYearly) : false,
        isCustomGmail:     Boolean(v.isCustomGmail),
      }

      if (prev) {
        await db.update(schema.productVariants).set(rowValues).where(eq(schema.productVariants.id, varId))
      } else {
        await db.insert(schema.productVariants).values({
          id: varId,
          productId: id,
          ...rowValues,
        })
      }
      keptIds.push(varId)
    }

    if (keptIds.length > 0) {
      await db.delete(schema.productVariants).where(
        and(
          eq(schema.productVariants.productId, id),
          notInArray(schema.productVariants.id, keptIds),
        )
      )
    } else {
      await db.delete(schema.productVariants).where(eq(schema.productVariants.productId, id))
    }
  }

  return { ok: true }
})


