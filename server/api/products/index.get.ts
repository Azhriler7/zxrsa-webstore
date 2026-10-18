import { eq, count, type InferSelectModel } from 'drizzle-orm'
import * as schema from '../../db/schema'
import { isVariantPromoValidToday } from '../../utils/promo'

type Variant = InferSelectModel<typeof schema.productVariants>
type Product = InferSelectModel<typeof schema.products> & { variants: Variant[] }

export default defineEventHandler(async () => {
  const [productsRaw, stockCounts] = await Promise.all([
    db.query.products.findMany({
      where: eq(schema.products.isActive, true),
      with:  { variants: true },
    }),
    db
      .select({ variantId: schema.accountStocks.variantId, total: count() })
      .from(schema.accountStocks)
      .where(eq(schema.accountStocks.isSold, false))
      .groupBy(schema.accountStocks.variantId),
  ])

  const products = productsRaw as unknown as Product[]

  const stockMap = Object.fromEntries(
    stockCounts.map((s: { variantId: string; total: number }) => [s.variantId, s.total])
  )

  return products.map((product: Product) => ({
    ...product,
    variants: product.variants
      .filter((v: Variant) => v.isActive !== false)
      .map((variant: Variant) => {
        const { isPromo, finalPrice, effectivePromoPrice } = isVariantPromoValidToday(variant)
        return {
          ...variant,
          promoPrice: effectivePromoPrice,
          finalPrice,
          isPromo,
          stockCount: stockMap[variant.id] ?? 0,
        }
      }),
  }))
})