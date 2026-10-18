<script setup lang="ts">
interface OrderData {
  orderId: string; productName: string; duration: string; amount: number
  customerEmail: string; isCustomGmail: boolean; customGmailAccount: string | null
  deliveredAccountData: string | null; createdAt: string
}

const route   = useRoute()
const orderId = route.query.orderId as string
if (!orderId) navigateTo('/')

const { data: order, status, error } = await useFetch<OrderData>(`/api/order/${orderId}`)

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID',{ style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(n)
const formatDate = (d: string) =>
  new Intl.DateTimeFormat('id-ID',{ dateStyle:'full', timeStyle:'short' }).format(new Date(d))

const accountEmail    = computed(() => order.value?.deliveredAccountData?.split(':')[0] ?? '')
const accountPassword = computed(() => order.value?.deliveredAccountData?.split(':').slice(1).join(':') ?? '')

const notaRef       = ref<HTMLElement | null>(null)
const isDownloading = ref(false)
const toast         = useToast()

async function downloadNota() {
  if (!notaRef.value) return
  isDownloading.value = true
  try {
    const { toPng } = await import('html-to-image')
    const dataUrl   = await toPng(notaRef.value, { pixelRatio: 2 })
    const link      = document.createElement('a')
    link.download   = `nota-${orderId}.png`
    link.href       = dataUrl; link.click()
    toast.add({ title: 'Nota tersimpan!', color: 'success' })
  }
  catch { toast.add({ title: 'Gagal menyimpan nota', color: 'error' }) }
  finally { isDownloading.value = false }
}

// Fix: helper untuk ambil error message tanpa TS error
function getErrorMessage(): string {
  if (!error.value) return 'Periksa kembali link kamu.'
  const data = error.value.data as { message?: string } | null
  return data?.message ?? 'Periksa kembali link kamu.'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">

    <div v-if="status === 'pending'" class="text-center space-y-3">
      <UIcon name="i-lucide-loader-circle" class="size-10 animate-spin text-primary-500" />
      <p class="text-gray-500">Mengambil data transaksi...</p>
    </div>

    <UCard v-else-if="error" class="max-w-md w-full text-center">
      <UIcon name="i-lucide-circle-x" class="size-12 text-red-500 mx-auto mb-3" />
      <h1 class="font-bold text-lg mb-1">Transaksi Tidak Ditemukan</h1>
      <!-- Fix: pakai getErrorMessage() -->
      <p class="text-sm text-gray-500 mb-4">{{ getErrorMessage() }}</p>
      <UButton to="/" label="Kembali ke Toko" icon="i-lucide-arrow-left" />
    </UCard>

    <div v-else-if="order" class="max-w-md w-full space-y-4">
      <div class="text-center">
        <div class="size-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
          <UIcon name="i-lucide-circle-check" class="size-9 text-green-500" />
        </div>
        <h1 class="text-2xl font-bold">Pembayaran Berhasil!</h1>
        <p class="text-gray-500 text-sm mt-1">Akun kamu sudah siap digunakan</p>
      </div>

      <div ref="notaRef" class="bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-4 shadow-lg border border-gray-100 dark:border-gray-800">
        <div class="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700 pb-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-zap" class="text-primary-500 size-5" />
            <span class="font-bold">ZXRSA STORE</span>
          </div>
          <UBadge color="success" label="LUNAS" />
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">Produk</span><span class="font-medium">{{ order.productName }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Paket</span><span class="font-medium">{{ order.duration }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Total</span><span class="font-bold text-primary-600 dark:text-primary-400">{{ formatRupiah(order.amount) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Email</span><span class="font-medium">{{ order.customerEmail }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Tanggal</span><span class="font-medium text-xs">{{ formatDate(order.createdAt) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Order ID</span><span class="font-mono text-xs">{{ order.orderId }}</span></div>
        </div>

        <template v-if="order.deliveredAccountData">
          <div class="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 space-y-3">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Akun Premium</p>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
              <div class="space-y-1"><p class="text-xs text-gray-400">Email Akun</p><p class="font-mono font-bold text-sm break-all">{{ accountEmail }}</p></div>
              <div class="space-y-1"><p class="text-xs text-gray-400">Password</p><p class="font-mono font-bold text-sm break-all">{{ accountPassword }}</p></div>
            </div>
            <UAlert color="warning" variant="subtle" icon="i-lucide-triangle-alert"
              description="Jangan ganti password akun ini. Screenshot atau simpan nota sebelum menutup halaman."
            />
          </div>
        </template>

        <template v-else-if="order.isCustomGmail">
          <div class="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
            <UAlert color="info" variant="subtle" icon="i-lucide-clock" title="Sedang diproses admin"
              :description="`Akun untuk ${order.customGmailAccount} akan dikirim ke ${order.customerEmail} dalam 1x24 jam.`"
            />
          </div>
        </template>
      </div>

      <div class="flex gap-3">
        <UButton block icon="i-lucide-image-down" :loading="isDownloading" label="Simpan Nota" color="primary" @click="downloadNota" />
        <UButton block icon="i-lucide-store" label="Beli Lagi" color="neutral" variant="outline" to="/" />
      </div>
    </div>

  </div>
</template>
