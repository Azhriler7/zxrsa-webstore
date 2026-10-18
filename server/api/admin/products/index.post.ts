import * as schema from '../../../db/schema'
import { getJakartaDateParts } from '../../../utils/promo'

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
  const body = await readBody<{
    id: string
    name: string
    description?: string
    image?: string
    promoBadge?: string
    rules?: string
    isActive?: boolean
    variants?: VariantInputPayload[]
  }>(event)

  if (!body.id || !body.name) {
    throw createError({ statusCode: 400, message: 'ID dan nama produk wajib diisi.' })
  }

  const { todayYYYYMMDD } = getJakartaDateParts()
  const cleanProductId = body.id.trim().toLowerCase().replace(/\s+/g, '-')

  if (Array.isArray(body.variants)) {
    for (const v of body.variants) {
      if (v.isPromoActive && v.promoStartDate && v.promoStartDate < todayYYYYMMDD) {
        throw createError({
          statusCode: 400,
          message: `Tanggal diskon paket "${v.duration}" tidak boleh sebelum hari ini (${todayYYYYMMDD}).`,
        })
      }
    }
  }

  const newProduct: typeof schema.products.$inferInsert = {
    id:          cleanProductId,
    name:        body.name.trim(),
    description: body.description?.trim() || null,
    image:       body.image?.trim()       || null,
    promoBadge:  body.promoBadge?.trim()  || null,
    rules:       body.rules?.trim()       || null,
    isActive:    body.isActive ?? true,
  }

  await db.insert(schema.products).values(newProduct)

  if (Array.isArray(body.variants) && body.variants.length > 0) {
    for (let i = 0; i < body.variants.length; i++) {
      const v = body.variants[i]
      if (!v) continue
      const varId = v.id?.trim() || `${cleanProductId}-pkg-${Date.now()}-${i}`
      const disc = v.isPromoActive ? Number(v.discountAmount ?? 0) : 0
      const calcPromoPrice = v.isPromoActive && disc > 0
        ? Math.max(0, Number(v.price) - disc)
        : (v.promoPrice ?? null)
      const mmdd = v.promoStartDate && v.promoStartDate.length >= 10
        ? v.promoStartDate.slice(5, 10)
        : (v.promoSpecificDate || null)

      const newVariant: typeof schema.productVariants.$inferInsert = {
        id:                varId,
        productId:         cleanProductId,
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

      await db.insert(schema.productVariants).values(newVariant)
    }
  }

  return { ok: true, id: cleanProductId }
})