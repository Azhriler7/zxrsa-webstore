import { eq }            from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'orderId')

  if (!orderId)
    throw createError({ statusCode: 400, message: 'Order ID tidak valid.' })

  const transaction = await db.query.transactions.findFirst({
    where: eq(schema.transactions.id, orderId),
    with:  { variant: { with: { product: true } } },
  })

  if (!transaction)
    throw createError({ statusCode: 404, message: 'Transaksi tidak ditemukan.' })

  if (transaction.status !== 'settlement') {
    throw createError({
      statusCode: 403,
      message: transaction.status === 'pending'
        ? 'Pembayaran belum selesai.'
        : 'Transaksi tidak valid.',
    })
  }

  return {
    orderId:              transaction.id,
    productName:          transaction.variant.product.name,
    duration:             transaction.variant.duration,
    amount:               transaction.amount,
    customerEmail:        transaction.customerEmail,
    isCustomGmail:        transaction.variant.isCustomGmail,
    customGmailAccount:   transaction.customGmailAccount,
    deliveredAccountData: transaction.deliveredAccountData ?? null,
    createdAt:            transaction.createdAt,
  }
})
