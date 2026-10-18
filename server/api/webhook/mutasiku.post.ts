import { eq }                from 'drizzle-orm'
import { processSettlement } from '../../utils/settlement'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.mutasikuWebhookSecret || config.mutasikuWebhookSecret.length < 8)
    throw createError({ statusCode: 500, message: 'Webhook secret belum dikonfigurasi.' })

  const incomingSecret = getHeader(event, 'x-webhook-secret')
                      ?? getHeader(event, 'x-mutasiku-secret')

  if (!incomingSecret || incomingSecret !== config.mutasikuWebhookSecret)
    throw createError({ statusCode: 403, message: 'Invalid webhook secret.' })

  const body = await readBody<{ orderId?: string; status?: string }>(event).catch(() => null)
  if (!body?.orderId) return { received: true }

  const transaction = await db.query.transactions.findFirst({
    where: eq(schema.transactions.id, body.orderId),
  })

  if (!transaction || transaction.status !== 'pending')
    return { received: true }

  if (body.status === 'PAID' || body.status === 'SUCCESS')
    await processSettlement(transaction.id)

  return { received: true }
})

