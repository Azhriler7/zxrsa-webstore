<script setup lang="ts">
interface Variant {
  id: string; duration: string; price: number; promoPrice: number | null
  finalPrice: number; isPromo: boolean; stockCount: number; isCustomGmail: boolean
}
interface Product {
  id: string; name: string; description: string | null
  image: string | null; promoBadge: string | null; variants: Variant[]
}

const { data: products, status } = await useFetch<Product[]>('/api/products')

const selectedProduct = ref<Product | null>(null)
const selectedVariant = ref<Variant | null>(null)
const customerEmail   = ref('')
const customGmail     = ref('')
const isCheckoutOpen  = ref(false)
const isProcessing    = ref(false)
const qrisModal       = ref(false)
const qrisData        = ref<{
  orderId: string; qrisImageUrl: string; amount: number; expiresAt: string
} | null>(null)
let pollInterval: ReturnType<typeof setInterval> | null = null
const toast = useToast()

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID',{ style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(n)

function openCheckout(product: Product, variant: Variant) {
  if (variant.stockCount === 0 && !variant.isCustomGmail) return
  selectedProduct.value = product; selectedVariant.value = variant
  customerEmail.value = ''; customGmail.value = ''; isCheckoutOpen.value = true
}

function closeQrisModal() {
  if (pollInterval) clearInterval(pollInterval)
  qrisModal.value = false
}

onUnmounted(() => { if (pollInterval) clearInterval(pollInterval) })

async function handleCheckout() {
  if (!selectedVariant.value || !customerEmail.value) return
  if (selectedVariant.value.isCustomGmail && !customGmail.value) {
    toast.add({ title: 'Gmail wajib diisi.', color: 'error' }); return
  }

  isProcessing.value = true
  try {
    const res = await $fetch<{
      orderId: string; qrisImageUrl: string; amount: number; expiresAt: string
    }>('/api/checkout', {
      method: 'POST',
      body: {
        variantId:          selectedVariant.value.id,
        customerEmail:      customerEmail.value,
        customGmailAccount: selectedVariant.value.isCustomGmail ? customGmail.value : undefined,
      },
    })

    isCheckoutOpen.value = false
    qrisData.value       = res
    qrisModal.value      = true

    // Polling status pembayaran setiap 3 detik
    pollInterval = setInterval(async () => {
      try {
        const { isPaid } = await $fetch<{ isPaid: boolean }>(`/api/payment/status/${res.orderId}`)
        if (isPaid) {
          clearInterval(pollInterval!)
          qrisModal.value = false
          navigateTo(`/success?orderId=${res.orderId}`)
        }
      }
      catch { /* masih pending, lanjut polling */ }
    }, 3000)
  }
  catch (err: any) {
    toast.add({ title: 'Gagal', description: err?.data?.message ?? 'Terjadi kesalahan.', color: 'error' })
  }
  finally { isProcessing.value = false }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">

    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-zap" class="text-primary-500 size-6" />
          <span class="font-bold text-lg">ZXRSA STORE</span>
        </div>
        <UBadge color="success" variant="subtle" label="✓ Pengiriman Otomatis" />
      </div>
    </header>

    <div class="bg-linear-to-br from-primary-600 to-primary-800 text-white py-12 px-4 text-center">
      <h1 class="text-3xl font-bold mb-2">Akun Digital Premium</h1>
      <p class="text-primary-100">Netflix · Spotify · CapCut · dan banyak lagi</p>
    </div>

    <main class="max-w-6xl mx-auto px-4 py-10">
      <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="n in 6" :key="n" class="h-64 rounded-xl" />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard v-for="product in products" :key="product.id" class="overflow-hidden hover:shadow-lg transition-shadow">
          <template #header>
            <div class="relative">
              <img v-if="product.image" :src="product.image" :alt="product.name" class="w-full h-40 object-cover" />
              <div v-else class="w-full h-40 bg-linear-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                <UIcon name="i-lucide-package" class="size-16 text-primary-400" />
              </div>
              <UBadge v-if="product.promoBadge" color="error" class="absolute top-2 right-2" :label="product.promoBadge" />
            </div>
          </template>

          <div class="space-y-3">
            <h2 class="font-bold text-lg">{{ product.name }}</h2>
            <p v-if="product.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {{ product.description }}
            </p>

            <div class="space-y-2">
              <div
                v-for="variant in product.variants" :key="variant.id"
                class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 transition-colors"
                :class="{ 'opacity-50': variant.stockCount === 0 && !variant.isCustomGmail }"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-sm">{{ variant.duration }}</span>
                    <UBadge v-if="variant.isPromo"       color="error" variant="subtle" size="xs" label="PROMO" />
                    <UBadge v-if="variant.isCustomGmail" color="info"  variant="subtle" size="xs" label="Gmail Sendiri" />
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="font-bold text-primary-600 dark:text-primary-400">{{ formatRupiah(variant.finalPrice) }}</span>
                    <span v-if="variant.isPromo" class="text-xs text-gray-400 line-through">{{ formatRupiah(variant.price) }}</span>
                  </div>
                  <span class="text-xs text-gray-400">
                    {{ variant.isCustomGmail ? 'Gmail sendiri' : variant.stockCount > 0 ? `${variant.stockCount} tersedia` : 'Stok habis' }}
                  </span>
                </div>
                <UButton
                  size="sm"
                  :disabled="variant.stockCount === 0 && !variant.isCustomGmail"
                  :label="variant.stockCount === 0 && !variant.isCustomGmail ? 'Habis' : 'Beli'"
                  :color="variant.stockCount === 0 && !variant.isCustomGmail ? 'neutral' : 'primary'"
                  @click="openCheckout(product, variant)"
                />
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </main>

    <!-- Modal Checkout -->
    <UModal v-model:open="isCheckoutOpen" :title="`Beli ${selectedProduct?.name} – ${selectedVariant?.duration}`">
      <template #body>
        <div class="space-y-4 p-1">
          <UAlert color="primary" variant="subtle" icon="i-lucide-info"
            :description="`${selectedProduct?.name} · ${selectedVariant?.duration} · ${formatRupiah(selectedVariant?.finalPrice ?? 0)}`"
          />
          <UFormField label="Email kamu" required>
            <UInput v-model="customerEmail" type="email" placeholder="email@gmail.com" icon="i-lucide-mail" class="w-full" />
          </UFormField>
          <UFormField v-if="selectedVariant?.isCustomGmail" label="Gmail kamu" description="Gmail yang dipakai untuk akun ini" required>
            <UInput v-model="customGmail" type="email" placeholder="gmailkamu@gmail.com" icon="i-lucide-at-sign" class="w-full" />
          </UFormField>
          <UButton
            block size="lg" :loading="isProcessing"
            :disabled="!customerEmail || (selectedVariant?.isCustomGmail && !customGmail)"
            label="Buat QRIS" icon="i-lucide-qr-code"
            @click="handleCheckout"
          />
          <p class="text-xs text-center text-gray-400">Bayar via QRIS · Data akun dikirim otomatis setelah lunas</p>
        </div>
      </template>
    </UModal>

    <!-- Modal QRIS -->
    <UModal v-model:open="qrisModal" title="Scan QRIS untuk Bayar" :dismissible="false">
      <template #body>
        <div class="space-y-4 p-2 text-center">
          <UAlert color="warning" variant="subtle" icon="i-lucide-clock"
            description="Jangan tutup halaman ini sebelum bayar. Halaman otomatis redirect setelah pembayaran terdeteksi."
          />
          <!-- qrisImageUrl = data.qrisImage dari Mutasiku (PNG langsung) -->
          <div class="flex justify-center">
            <img
              v-if="qrisData?.qrisImageUrl"
              :src="qrisData.qrisImageUrl"
              alt="QRIS Pembayaran"
              class="w-64 h-64 border-4 border-primary-200 rounded-2xl"
            />
          </div>
          <p class="font-bold text-xl text-primary-600">{{ formatRupiah(qrisData?.amount ?? 0) }}</p>
          <p class="text-xs text-gray-400">Order: {{ qrisData?.orderId }}</p>
          <div class="flex items-center justify-center gap-2 text-sm text-gray-500">
            <UIcon name="i-lucide-loader-circle" class="animate-spin size-4" />
            Menunggu pembayaran...
          </div>
          <UButton block color="neutral" variant="ghost" label="Batal" @click="closeQrisModal" />
        </div>
      </template>
    </UModal>

  </div>
</template>
