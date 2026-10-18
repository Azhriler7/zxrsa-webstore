<script setup lang="ts">
import type { ProductItem, VariantItem } from '~/components/ProductCheckoutSection.vue'
import type { InvoiceOrderData } from '~/components/InvoiceCardStep.vue'

const { data: productsData, status, refresh: refreshProducts } = await useFetch<ProductItem[]>('/api/products')
const products = computed(() => productsData.value ?? [])

const currentView = ref<'catalog' | 'qris' | 'invoice'>('catalog')
const isProcessing = ref(false)
const isCheckingPayment = ref(false)

const isTransitionLoading = ref(false)
const transitionTitle = ref('')
const transitionSubtitle = ref('')

const cyberToast = reactive<{
  open: boolean
  type: 'success' | 'error'
  message?: string
}>({
  open: false,
  type: 'success',
  message: undefined,
})

function triggerCyberToast(type: 'success' | 'error', message?: string) {
  cyberToast.open = false
  setTimeout(() => {
    cyberToast.type = type
    cyberToast.message = message
    cyberToast.open = true
  }, 40)
}

const activeQris = ref<{
  orderId: string
  qrisImageUrl: string
  amount: number
  expiresAt: string
  productName: string
  duration: string
  customerEmail: string
} | null>(null)

const completedOrder = ref<InvoiceOrderData | null>(null)
let pollInterval: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onUnmounted(() => stopPolling())

async function runTransitionOverlay(title: string, subtitle: string, durationMs = 750) {
  transitionTitle.value = title
  transitionSubtitle.value = subtitle
  isTransitionLoading.value = true
  await new Promise(resolve => setTimeout(resolve, durationMs))
  isTransitionLoading.value = false
}

async function handleCheckoutSubmit(payload: {
  product: ProductItem
  variant: VariantItem
  customerEmail: string
  customGmailAccount?: string
}) {
  isProcessing.value = true
  try {
    const res = await $fetch<{
      orderId: string
      qrisImageUrl: string
      amount: number
      expiresAt: string
    }>('/api/checkout', {
      method: 'POST',
      body: {
        variantId: payload.variant.id,
        customerEmail: payload.customerEmail,
        customGmailAccount: payload.customGmailAccount,
      },
    })

    await runTransitionOverlay(
      'Menyiapkan Gerbang Pembayaran QRIS...',
      `Mengamankan alokasi stok untuk pesanan ${res.orderId}`,
      750
    )

    activeQris.value = {
      ...res,
      productName: payload.product.name,
      duration: payload.variant.duration,
      customerEmail: payload.customerEmail,
    }

    currentView.value = 'qris'
    window.scrollTo({ top: 0, behavior: 'smooth' })

    stopPolling()
    pollInterval = setInterval(() => checkPaymentStatus(), 3000)
  } catch (err: any) {
    triggerCyberToast(
      'error',
      err?.data?.message || 'Aksi Ditolak: Transaksi Gagal. Silakan periksa saldo atau koneksi Anda.'
    )
  } finally {
    isProcessing.value = false
  }
}

async function checkPaymentStatus() {
  if (!activeQris.value) return
  isCheckingPayment.value = true
  try {
    const res = await $fetch<{
      isPaid: boolean
      status: string
      order?: InvoiceOrderData | null
    }>(`/api/payment/status/${activeQris.value.orderId}`)

    if (res.isPaid) {
      stopPolling()
      let resolvedOrder: InvoiceOrderData | null = null
      if (res.order) {
        resolvedOrder = res.order
      } else {
        resolvedOrder = await $fetch<InvoiceOrderData>(`/api/order/${activeQris.value.orderId}`)
      }

      await runTransitionOverlay(
        'Pembayaran Terverifikasi!',
        'Menerbitkan Kartu Invoice Resmi & Mengambil Kredensial Akun...',
        800
      )

      completedOrder.value = resolvedOrder
      await refreshProducts()
      currentView.value = 'invoice'
      triggerCyberToast('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (res.status === 'deny' || res.status === 'expire' || res.status === 'cancel') {
      stopPolling()
      triggerCyberToast('error')
      resetToCatalog()
    }
  } catch {
    // Still pending
  } finally {
    isCheckingPayment.value = false
  }
}

async function handleQrisExpired() {
  stopPolling()
  const expiredOrderId = activeQris.value?.orderId
  if (expiredOrderId) {
    await $fetch(`/api/payment/expire/${expiredOrderId}`, { method: 'POST' }).catch(() => {})
  }
  triggerCyberToast(
    'error',
    'Aksi Ditolak: Waktu pembayaran QRIS (5 menit) telah habis. Pesanan dibatalkan otomatis.'
  )
  resetToCatalog()
}

function resetToCatalog() {
  stopPolling()
  currentView.value = 'catalog'
  activeQris.value = null
  completedOrder.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
    <UserNavbar @go-home="resetToCatalog" />

    <!-- Cyber Loading Transition Overlay -->
    <Teleport to="body">
      <div
        v-if="isTransitionLoading"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md"
      >
        <div class="w-full max-w-sm rounded-2xl border border-[#00f0ff]/40 bg-zinc-900/95 p-6 text-center space-y-4 shadow-[0_0_35px_rgba(0,240,255,0.2)] animate-fade-up">
          <div class="size-12 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/40 flex items-center justify-center mx-auto text-[#00f0ff]">
            <svg class="size-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
              <path class="opacity-95" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <div class="space-y-1">
            <p class="font-mono text-[10px] font-bold uppercase tracking-widest text-[#00f0ff]">SYSTEM TRANSITION // PROCESSING</p>
            <h3 class="font-extrabold text-base text-white">{{ transitionTitle }}</h3>
            <p class="text-xs text-zinc-400">{{ transitionSubtitle }}</p>
          </div>
        </div>
      </div>
    </Teleport>

    <template v-if="currentView === 'catalog'">
      <HeroBanner />
      <ProductCheckoutSection
        :products="products"
        :loading="status === 'pending'"
        :processing="isProcessing"
        @submit-checkout="handleCheckoutSubmit"
        @validation-failed="(msg: string) => triggerCyberToast('error', msg)"
      />
      <ExtraSections />
    </template>

    <template v-else-if="currentView === 'qris' && activeQris">
      <QrisPaymentStep
        :qris-data="activeQris"
        :checking-status="isCheckingPayment"
        @check-now="checkPaymentStatus"
        @cancel="resetToCatalog"
        @expired="handleQrisExpired"
      />
    </template>

    <template v-else-if="currentView === 'invoice' && completedOrder">
      <InvoiceCardStep
        :order="completedOrder"
        @back-to-shop="resetToCatalog"
        @download-success="triggerCyberToast('success')"
      />
    </template>

    <!-- Floating WhatsApp Logo at Bottom-Right (ONLY on User Storefront) -->
    <FloatingWhatsApp />

    <CyberToast
      v-model:open="cyberToast.open"
      :type="cyberToast.type"
      :message="cyberToast.message"
    />
  </div>
</template>
