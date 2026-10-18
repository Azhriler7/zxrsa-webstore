import { eq, count } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const [products, unsoldCounts, allStocks] = await Promise.all([
    db.query.products.findMany({
      with: { variants: true },
    }),
    db.select({ variantId: schema.accountStocks.variantId, total: count() })
      .from(schema.accountStocks)
      .where(eq(schema.accountStocks.isSold, false))
      .groupBy(schema.accountStocks.variantId),
    db.query.accountStocks.findMany(),
  ])

  const stockMap = Object.fromEntries(
    unsoldCounts.map((s: { variantId: string; total: number }) => [s.variantId, s.total])
  )

  return products.map(p => ({
    ...p,
    variants: p.variants.map(v => ({
      ...v,
      stockCount: stockMap[v.id] ?? 0,
      stocks: allStocks.filter(st => st.variantId === v.id),
    })),
  }))
})
