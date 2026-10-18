import { eq, and, sql } from 'drizzle-orm'

export async function processSettlement(orderId: string) {
  // db dan schema otomatis di-inject oleh NuxtHub v0.10 (dari server/db/schema.ts)
  const updatedTx = await db
    .update(schema.transactions)
    .set({ status: 'settlement' })
    .where(and(
      eq(schema.transactions.id, orderId),
      eq(schema.transactions.status, 'pending'),
    ))
    .returning()

  if (updatedTx.length === 0)
    return { alreadyProcessed: true }

  const tx = updatedTx[0]!

  if (!tx.customGmailAccount) {
    const claimedStock = await db
      .update(schema.accountStocks)
      .set({ isSold: true, soldAt: new Date().toISOString() })
      .where(
        eq(
          schema.accountStocks.id,
          sql`(SELECT id FROM account_stocks WHERE variant_id = ${tx.variantId} AND is_sold = 0 LIMIT 1)`,
        ),
      )
      .returning()

    if (claimedStock.length > 0) {
      await db
        .update(schema.transactions)
        .set({ deliveredAccountData: claimedStock[0]!.accountData })
        .where(eq(schema.transactions.id, tx.id))
    }
  }

  return { alreadyProcessed: false }
}