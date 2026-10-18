import { eq, count, type InferSelectModel } from 'drizzle-orm'
import * as schema from '../../db/schema'
import { getJakartaDateParts } from '../../utils/promo'

type VariantRow = InferSelectModel<typeof schema.productVariants>
type ProductRow = InferSelectModel<typeof schema.products> & { variants: VariantRow[] }
type SettlementRow = InferSelectModel<typeof schema.transactions> & {
  variant?: (VariantRow & { product?: InferSelectModel<typeof schema.products> }) | null
}

export default defineEventHandler(async () => {
  const { nowWIB, todayYYYYMMDD } = getJakartaDateParts()

  const curYear = nowWIB.getFullYear()
  const curMonth = nowWIB.getMonth() + 1
  const lastMonthDate = new Date(curYear, curMonth - 2, 1)
  const lastMonthYYYYMM = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

  const [allSettlementsRaw, productsListRaw, unsoldCounts] = await Promise.all([
    db.query.transactions.findMany({
      where: eq(schema.transactions.status, 'settlement'),
      with: { variant: { with: { product: true } } },
    }),
    db.query.products.findMany({
      with: { variants: true },
    }),
    db.select({ variantId: schema.accountStocks.variantId, total: count() })
      .from(schema.accountStocks)
      .where(eq(schema.accountStocks.isSold, false))
      .groupBy(schema.accountStocks.variantId),
  ])

  const allSettlements = allSettlementsRaw as unknown as SettlementRow[]
  const productsList = productsListRaw as unknown as ProductRow[]

  const stockMap = Object.fromEntries(
    unsoldCounts.map((s: { variantId: string; total: number }) => [s.variantId, s.total])
  )

  let omzetTotal = 0
  let pendapatanHariIni = 0
  let pendapatanBulanKemarin = 0
  let antrianManual = 0
  const totalTransaksiSukses = allSettlements.length

  const revenueByProductMonth: Record<string, Record<string, Record<string, number>>> = {
    ALL: {},
  }

  const addRevenue = (bucketKey: string, monthKey: string, dayKey: string, amount: number) => {
    let monthMap = revenueByProductMonth[bucketKey]
    if (!monthMap) {
      monthMap = {}
      revenueByProductMonth[bucketKey] = monthMap
    }
    let dayMap = monthMap[monthKey]
    if (!dayMap) {
      dayMap = {}
      monthMap[monthKey] = dayMap
    }
    dayMap[dayKey] = (dayMap[dayKey] ?? 0) + amount
  }

  for (const tx of allSettlements) {
    const amt = Number(tx.amount ?? 0)
    omzetTotal += amt

    if (!tx.deliveredAccountData) {
      antrianManual += 1
    }

    const dateStr = (tx.createdAt ?? '').slice(0, 10)
    const monthStr = dateStr.slice(0, 7)
    const dayStr = dateStr.slice(8, 10)

    if (dateStr === todayYYYYMMDD) pendapatanHariIni += amt
    if (monthStr === lastMonthYYYYMM) pendapatanBulanKemarin += amt

    if (monthStr && dayStr) {
      addRevenue('ALL', monthStr, dayStr, amt)
      const prodId = tx.variant?.product?.id
      if (prodId) addRevenue(prodId, monthStr, dayStr, amt)
    }
  }

  const productsStockSummary = productsList.map(p => ({
    id: p.id,
    name: p.name,
    image: p.image,
    isActive: p.isActive,
    variants: p.variants.map(v => ({
      id: v.id,
      duration: v.duration,
      price: v.price,
      isActive: v.isActive ?? true,
      isCustomGmail: v.isCustomGmail,
      stockCount: stockMap[v.id] ?? 0,
    })),
  }))

  const stokSisa = unsoldCounts.reduce((acc, s) => acc + s.total, 0)

  return {
    antrianManual,
    omzetTotal,
    pendapatanHariIni,
    pendapatanBulanKemarin,
    totalTransaksiSukses,
    stokSisa,
    revenueByProductMonth,
    productsStockSummary,
  }
})