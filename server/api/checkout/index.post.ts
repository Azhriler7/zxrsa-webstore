import { eq, and, count, type InferSelectModel } from 'drizzle-orm'
import * as schema from '../../db/schema'
import { isVariantPromoValidToday } from '../../utils/promo'

type VariantWithProduct = InferSelectModel<typeof schema.productVariants> & {
  product: InferSelectModel<typeof schema.products>
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const body = await readValidatedBody(event, (raw: unknown) => {
    const b = raw as { variantId?: string; customerEmail?: string; customGmailAccount?: string }
    if (!b.variantId || !b.customerEmail)
      throw new Error('variantId dan customerEmail wajib.')
    return b as { variantId: string; customerEmail: string; customGmailAccount?: string }
  })

  const variantRaw = await db.query.productVariants.findFirst({
    where: eq(schema.productVariants.id, body.variantId),
    with:  { product: true },
  })
  const variant = variantRaw as unknown as VariantWithProduct | undefined

  if (!variant || !variant.product.isActive || variant.isActive === false)
    throw createError({ statusCode: 404, message: 'Produk atau paket tidak aktif.' })

  if (variant.isCustomGmail && !body.customGmailAccount)
    throw createError({ statusCode: 400, message: 'Gmail wajib diisi.' })

  if (!variant.isCustomGmail) {
    const stockRows = await db
      .select({ total: count() })
      .from(schema.accountStocks)
      .where(and(
        eq(schema.accountStocks.variantId, body.variantId),
        eq(schema.accountStocks.isSold, false),
      ))
    const total = stockRows.at(0)?.total ?? 0
    if (total === 0)
      throw createError({ statusCode: 409, message: 'Stok habis.' })
  }

  const { finalPrice: finalAmount } = isVariantPromoValidToday(variant)
  const orderId = `ORDER-${Date.now()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`

  await db.insert(schema.transactions).values({
    id:                 orderId,
    customerEmail:      body.customerEmail,
    customGmailAccount: body.customGmailAccount ?? null,
    variantId:          body.variantId,
    amount:             finalAmount,
    status:             'pending',
  })

  const origin      = getRequestURL(event).origin
  const mutasikuRes = await $fetch<{
    status: string
    message?: string
    data?: { id: string; qrImage?: string; qrisUrl?: string; expiredAt: string }
  }>('https://mutasiku.co.id/api/v1/payments', {
    method:  'POST',
    headers: {
      'x-api-key':    config.mutasikuApiKey,
      'Content-Type': 'application/json',
    },
    body: {
      paymentType:      config.mutasikuPaymentType || 'QRIS-DYNAMIC',
      walletAccountId:  config.mutasikuWalletAccountId,
      amount:           finalAmount,
      externalId:       orderId,
      customerName:     body.customerEmail.split('@')[0],
      customerEmail:    body.customerEmail,
      callbackUrl:      `${origin}/api/webhook/mutasiku`,
      returnUrl:        `${origin}/success?order_id=${orderId}`,
      expiredInMinutes: 5,
    },
  }).catch((err: unknown) => {
    throw createError({
      statusCode: 502,
      message: `Gagal membuat pembayaran: ${err instanceof Error ? err.message : 'Unknown error'}`,
    })
  })

  if (mutasikuRes.status !== 'success' || !mutasikuRes.data) {
    throw createError({
      statusCode: 502,
      message: mutasikuRes.message ?? 'Response tidak valid dari Mutasiku.',
    })
  }

  const qrisImageUrl = mutasikuRes.data.qrImage ?? mutasikuRes.data.qrisUrl ?? ''

  await db
    .update(schema.transactions)
    .set({ mutasikuPaymentId: mutasikuRes.data.id, qrisImageUrl })
    .where(eq(schema.transactions.id, orderId))

  return {
    orderId,
    qrisImageUrl,
    amount:    finalAmount,
    expiresAt: mutasikuRes.data.expiredAt,
  }
})