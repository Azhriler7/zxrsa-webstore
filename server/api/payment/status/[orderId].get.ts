import { eq, type InferSelectModel } from 'drizzle-orm'
import * as schema                   from '../../../db/schema'
import { processSettlement }         from '../../../utils/settlement'

type TransactionWithDetails = InferSelectModel<typeof schema.transactions> & {
  variant: InferSelectModel<typeof schema.productVariants> & {
    product: InferSelectModel<typeof schema.products>
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

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

  const buildOrderPayload = async (txId: string) => {
    const freshTxRaw = await db.query.transactions.findFirst({
      where: eq(schema.transactions.id, txId),
      with:  { variant: { with: { product: true } } },
    })
    const freshTx = freshTxRaw as unknown as TransactionWithDetails | undefined
    if (!freshTx) return null
    return {
      orderId:              freshTx.id,
      productName:          freshTx.variant.product.name,
      productImage:         freshTx.variant.product.image ?? null,
      productRules:         freshTx.variant.product.rules ?? null,
      duration:             freshTx.variant.duration,
      variantId:            freshTx.variantId,
      amount:               freshTx.amount,
      status:               freshTx.status,
      mutasikuPaymentId:    freshTx.mutasikuPaymentId ?? null,
      customerEmail:        freshTx.customerEmail,
      isCustomGmail:        freshTx.variant.isCustomGmail,
      customGmailAccount:   freshTx.customGmailAccount,
      deliveredAccountData: freshTx.deliveredAccountData ?? null,
      createdAt:            freshTx.createdAt,
    }
  }

  if (transaction.status === 'settlement') {
    const order = await buildOrderPayload(transaction.id)
    return { isPaid: true, status: 'settlement', order }
  }

  if (!transaction.mutasikuPaymentId)
    return { isPaid: false, status: 'pending', order: null }

  const mutasikuStatus = await $fetch<{
    status: string
    data: { id: string; status: string; paidAt?: string }
  }>(
    `https://mutasiku.co.id/api/v1/payments/status/${transaction.mutasikuPaymentId}`,
    { headers: { 'x-api-key': config.mutasikuApiKey } },
  ).catch(() => null)

  if (!mutasikuStatus || mutasikuStatus.status !== 'success')
    return { isPaid: false, status: 'pending', order: null }

  if (mutasikuStatus.data.status === 'PAID') {
    await processSettlement(transaction.id)
    const order = await buildOrderPayload(transaction.id)
    return { isPaid: true, status: 'settlement', order }
  }

  return { isPaid: false, status: mutasikuStatus.data.status.toLowerCase(), order: null }
})