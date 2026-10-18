import { eq, and, count }  from 'drizzle-orm'
import type { DayOfWeek }  from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const body = await readValidatedBody(event, (raw: unknown) => {
    const b = raw as { variantId?: string; customerEmail?: string; customGmailAccount?: string }
    if (!b.variantId || !b.customerEmail)
      throw new Error('variantId dan customerEmail wajib.')
    return b as { variantId: string; customerEmail: string; customGmailAccount?: string }
  })

  const variant = await db.query.productVariants.findFirst({
    where: eq(schema.productVariants.id, body.variantId),
    with:  { product: true },
  })

  if (!variant || !variant.product.isActive)
    throw createError({ statusCode: 404, message: 'Produk tidak ditemukan.' })

  if (variant.isCustomGmail && !body.customGmailAccount)
    throw createError({ statusCode: 400, message: 'Gmail wajib diisi.' })

  if (!variant.isCustomGmail) {
    // Fix: pakai .at(0)?.total bukan destructure [{ total }]
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

  const nowWIB = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const days: DayOfWeek[] = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const todayDayName = days[nowWIB.getDay()]!
  const todayMMDD    = `${String(nowWIB.getMonth()+1).padStart(2,'0')}-${String(nowWIB.getDate()).padStart(2,'0')}`
  const isPromo      = (variant.promoDayOfWeek === todayDayName || variant.promoSpecificDate === todayMMDD)
                        && variant.promoPrice !== null
  const finalAmount  = isPromo ? variant.promoPrice! : variant.price

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
  const redirectUrl = `${origin}/success?orderId=${orderId}`

  const mutasikuRes = await $fetch<{
    status: string
    data: {
      id: string; amount: number; totalAmount: number
      expiresAt: string; paymentUrl: string; type: string; qrisImage: string
    }
  }>(
    'https://mutasiku.co.id/api/v1/payments',
    {
      method: 'POST',
      headers: { 'x-api-key': config.mutasikuApiKey, 'Content-Type': 'application/json' },
      body: {
        amount:          finalAmount,
        walletAccountId: config.mutasikuWalletAccountId,
        orderId,
        redirectUrl,
        type:            config.mutasikuPaymentType,
      },
    },
  ).catch(() => { throw createError({ statusCode: 502, message: 'Gagal membuat QRIS.' }) })

  if (mutasikuRes.status !== 'success')
    throw createError({ statusCode: 502, message: 'Mutasiku error.' })

  await db
    .update(schema.transactions)
    .set({ mutasikuPaymentId: mutasikuRes.data.id, qrisImageUrl: mutasikuRes.data.qrisImage })
    .where(eq(schema.transactions.id, orderId))

  return {
    orderId,
    qrisImageUrl:      mutasikuRes.data.qrisImage,
    mutasikuPaymentId: mutasikuRes.data.id,
    amount:            finalAmount,
    expiresAt:         mutasikuRes.data.expiresAt,
  }
})
