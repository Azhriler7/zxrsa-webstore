import { eq }            from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id              = getRouterParam(event, 'id')!
  const { accountData } = await readBody<{ accountData: string }>(event)

  if (!accountData?.includes(':'))
    throw createError({ statusCode: 400, message: 'Format: email:password' })

  const transaction = await db.query.transactions.findFirst({
    where: eq(schema.transactions.id, id),
  })

  if (!transaction || transaction.status !== 'settlement')
    throw createError({ statusCode: 404, message: 'Transaksi tidak valid.' })

  await db
    .update(schema.transactions)
    .set({ deliveredAccountData: accountData })
    .where(eq(schema.transactions.id, id))

  return { ok: true }
})
