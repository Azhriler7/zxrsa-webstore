export interface PromoVariantFields {
  price: number
  isActive?: boolean | null
  isPromoActive?: boolean | null
  discountAmount?: number | null
  promoPrice?: number | null
  promoStartDate?: string | null
  promoDayOfWeek?: string | null
  promoSpecificDate?: string | null
  promoRepeatYearly?: boolean | null
}

export function getJakartaDateParts() {
  const nowWIB = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  )
  const year = nowWIB.getFullYear()
  const month = String(nowWIB.getMonth() + 1).padStart(2, '0')
  const day = String(nowWIB.getDate()).padStart(2, '0')
  const todayYYYYMMDD = `${year}-${month}-${day}`
  const todayMMDD = `${month}-${day}`
  const todayDayName = nowWIB.toLocaleDateString('en-US', { weekday: 'long' })

  return { nowWIB, year, month, day, todayYYYYMMDD, todayMMDD, todayDayName }
}

export function isVariantPromoValidToday(variant: PromoVariantFields): {
  isPromo: boolean
  finalPrice: number
  effectivePromoPrice: number | null
} {
  const basePrice = Number(variant.price ?? 0)
  const discount = Number(variant.discountAmount ?? 0)
  const computedPromo =
    discount > 0
      ? Math.max(0, basePrice - discount)
      : variant.promoPrice != null && Number(variant.promoPrice) > 0
        ? Number(variant.promoPrice)
        : null

  if (computedPromo === null || computedPromo >= basePrice) {
    return { isPromo: false, finalPrice: basePrice, effectivePromoPrice: null }
  }

  if (variant.isPromoActive === false) {
    return { isPromo: false, finalPrice: basePrice, effectivePromoPrice: computedPromo }
  }

  const { todayYYYYMMDD, todayMMDD, todayDayName } = getJakartaDateParts()

  if (variant.promoStartDate && todayYYYYMMDD < variant.promoStartDate) {
    return { isPromo: false, finalPrice: basePrice, effectivePromoPrice: computedPromo }
  }

  const hasWeekly = Boolean(variant.promoDayOfWeek)
  const hasYearly = Boolean(variant.promoRepeatYearly && variant.promoSpecificDate)
  const hasSpecific = Boolean(!variant.promoRepeatYearly && variant.promoSpecificDate)

  if (hasWeekly || hasYearly || hasSpecific) {
    const matchWeekly = hasWeekly && variant.promoDayOfWeek === todayDayName
    const matchYearly = hasYearly && variant.promoSpecificDate === todayMMDD
    const matchSpecific =
      hasSpecific &&
      (variant.promoSpecificDate === todayMMDD || variant.promoStartDate === todayYYYYMMDD)

    if (!matchWeekly && !matchYearly && !matchSpecific) {
      return { isPromo: false, finalPrice: basePrice, effectivePromoPrice: computedPromo }
    }
  }

  return { isPromo: true, finalPrice: computedPromo, effectivePromoPrice: computedPromo }
}