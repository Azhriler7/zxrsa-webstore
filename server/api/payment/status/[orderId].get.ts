import { eq }                      from 'drizzle-orm'
import { processSettlement }       from '#server/utils/settlement'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const orderId = getRouterParam(event, 'orderId')
  if (!orderId)
    throw createError({ statusCode: 400, message: 'Order ID tidak valid.' })

  const transaction = await db.query.transactions.findFirst({
    where: eq(schema.transactions.id, orderId),
  })

  if (!transaction)
    throw createError({ statusCode: 404, message: 'Transaksi tidak ditemukan.' })

  if (transaction.status === 'settlement')
    return { isPaid: true, status: 'settlement' }

  if (!transaction.mutasikuPaymentId)
    return { isPaid: false, status: 'pending' }

  // Cek status ke Mutasiku
  // GET /api/v1/payments/status/{mutasikuPaymentId} → data.status === 'PAID'
  const mutasikuStatus = await $fetch<{
    status: string
    data: { id: string; status: string; paidAt?: string }
  }>(
    `https://mutasiku.co.id/api/v1/payments/status/${transaction.mutasikuPaymentId}`,
    { headers: { 'x-api-key': config.mutasikuApiKey } },
  ).catch(() => null)

  if (!mutasikuStatus || mutasikuStatus.status !== 'success')
    return { isPaid: false, status: 'pending' }

  if (mutasikuStatus.data.status === 'PAID') {
    await processSettlement(transaction.id)
    return { isPaid: true, status: 'settlement' }
  }

  return { isPaid: false, status: mutasikuStatus.data.status.toLowerCase() }
})
