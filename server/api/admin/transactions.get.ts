import { desc }          from 'drizzle-orm'

type TransactionWithRelations = typeof schema.transactions.$inferSelect & {
  variant: typeof schema.productVariants.$inferSelect & {
    product: typeof schema.products.$inferSelect
  }
}

export default defineEventHandler(async (event) => {
  const query  = getQuery(event)
  const filter = query.filter as string | undefined

  const transactions = await db.query.transactions.findMany({
    with:    { variant: { with: { product: true } } },
    orderBy: [desc(schema.transactions.createdAt)],
    limit:   100,
  }) as TransactionWithRelations[]  // ← FIX: cast ke type yang benar

  if (filter === 'unfulfilled')
    return transactions.filter(tx => tx.status === 'settlement' && !tx.deliveredAccountData)

  return transactions
})
