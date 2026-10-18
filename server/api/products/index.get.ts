import { eq, count }    from 'drizzle-orm'
import type { DayOfWeek } from '#server/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type Variant = InferSelectModel<typeof schema.productVariants>
type Product = InferSelectModel<typeof schema.products> & { variants: Variant[] }

export default defineEventHandler(async () => {

  const nowWIB = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const days: DayOfWeek[] = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const todayDayName = days[nowWIB.getDay()]!
  const todayMMDD    = `${String(nowWIB.getMonth()+1).padStart(2,'0')}-${String(nowWIB.getDate()).padStart(2,'0')}`

  const [products, stockCounts] = await Promise.all([
    db.query.products.findMany({
      where: eq(schema.products.isActive, true),
      with:  { variants: true },
    }) as Promise<Product[]>,  // ← cast eksplisit
    db
      .select({ variantId: schema.accountStocks.variantId, total: count() })
      .from(schema.accountStocks)
      .where(eq(schema.accountStocks.isSold, false))
      .groupBy(schema.accountStocks.variantId),
  ])

  // Fix: type annotation eksplisit untuk s
  const stockMap = Object.fromEntries(
    stockCounts.map((s: { variantId: string; total: number }) => [s.variantId, s.total])
  )

  // Fix: type annotation eksplisit untuk product dan variant
  return (products as Product[]).map((product: Product) => ({
    ...product,
    variants: product.variants.map((variant: Variant) => {
      const isPromoDay  = variant.promoDayOfWeek === todayDayName
      const isPromoDate = variant.promoSpecificDate === todayMMDD
      const isPromo     = (isPromoDay || isPromoDate) && variant.promoPrice !== null
      return {
        ...variant,
        finalPrice: isPromo ? variant.promoPrice! : variant.price,
        isPromo,
        stockCount: stockMap[variant.id] ?? 0,
      }
    }),
  }))
})
