import { eq, type InferSelectModel } from 'drizzle-orm'
import * as schema from '../../db/schema'

type TransactionWithDetails = InferSelectModel<typeof schema.transactions> & {
  variant: InferSelectModel<typeof schema.productVariants> & {
    product: InferSelectModel<typeof schema.products>
  }
}

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'orderId')
  if (!orderId)
    throw createError({ statusCode: 400, message: 'Order ID tidak valid.' })

  const transactionRaw = await db.query.transactions.findFirst({
    where: eq(schema.transactions.id, orderId),
    with:  { variant: { with: { product: true } } },
  })
  const transaction = transactionRaw as unknown as TransactionWithDetails | undefined

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
    productImage:         transaction.variant.product.image ?? null,
    productRules:         transaction.variant.product.rules ?? null,
    duration:             transaction.variant.duration,
    variantId:            transaction.variantId,
    amount:               transaction.amount,
    status:               transaction.status,
    mutasikuPaymentId:    transaction.mutasikuPaymentId ?? null,
    customerEmail:        transaction.customerEmail,
    isCustomGmail:        transaction.variant.isCustomGmail,
    customGmailAccount:   transaction.customGmailAccount,
    deliveredAccountData: transaction.deliveredAccountData ?? null,
    createdAt:            transaction.createdAt,
  }
})