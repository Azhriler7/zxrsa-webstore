import { eq, and, sum, count, gte } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19)

  const [omzetTotal, stokSisa, recentSettlements] = await Promise.all([
    db.select({ total: sum(schema.transactions.amount) })
      .from(schema.transactions)
      .where(eq(schema.transactions.status, 'settlement')),
    db.select({ total: count() })
      .from(schema.accountStocks)
      .where(eq(schema.accountStocks.isSold, false)),
    db.select({
      amount:    schema.transactions.amount,
      createdAt: schema.transactions.createdAt,
    })
      .from(schema.transactions)
      .where(and(
        eq(schema.transactions.status, 'settlement'),
        gte(schema.transactions.createdAt, sevenDaysAgo),
      )),
  ])

  const revenueByDay: Record<string, number> = {}
  for (const tx of recentSettlements) {
    const day = tx.createdAt.slice(0, 10)
    revenueByDay[day] = (revenueByDay[day] ?? 0) + tx.amount
  }

  return {
    omzetTotal: Number(omzetTotal.at(0)?.total ?? 0),
    stokSisa:   stokSisa.at(0)?.total ?? 0,
    revenueByDay,
  }
})