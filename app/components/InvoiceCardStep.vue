<script setup lang="ts">
export interface InvoiceOrderData {
  orderId: string
  productName: string
  productImage?: string | null
  productRules?: string | null
  duration: string
  variantId?: string
  amount: number
  status?: string
  mutasikuPaymentId?: string | null
  customerEmail: string
  isCustomGmail: boolean
  customGmailAccount: string | null
  deliveredAccountData: string | null
  createdAt: string
}

const props = defineProps<{
  order: InvoiceOrderData
}>()

const emit = defineEmits<{
  'back-to-shop': []
}>()

const notaRef = ref<HTMLElement | null>(null)
const isDownloading = ref(false)
const copiedField = ref<string | null>(null)
const toast = useToast()

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const formatDate = (d: string) => {
  try {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(d))
  } catch {
    return d
  }
}

const accountEmail = computed(() => props.order.deliveredAccountData?.split(':')[0] ?? '')
const accountPassword = computed(() => props.order.deliveredAccountData?.split(':').slice(1).join(':') ?? '')

const formattedRules = computed(() => {
  const raw = props.order.productRules?.trim()
  if (!raw) {
    return [
      'Dilarang mengubah email, password, atau informasi keamanan akun.',
      'Gunakan sesuai jumlah perangkat yang ditentukan pada paket.',
      'Simpan Kartu Invoice ini sebagai syarat sah klaim garansi.',
    ]
  }
  return raw.split('\n').map(l => l.trim()).filter(Boolean)
})

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = label
    setTimeout(() => { copiedField.value = null }, 2000)
    toast.add({ title: `${label} disalin!`, color: 'success' })
  } catch {
    toast.add({ title: 'Gagal menyalin teks', color: 'error' })
  }
}

async function downloadInvoicePng() {
  if (!notaRef.value) return
  isDownloading.value = true
  try {
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(notaRef.value, { pixelRatio: 2 })
    const link = document.createElement('a')
    link.download = `invoice-${props.order.orderId}.png`
    link.href = dataUrl
    link.click()
    toast.add({ title: 'Kartu Invoice berhasil diunduh!', color: 'success' })
  } catch {
    toast.add({ title: 'Gagal menyimpan gambar invoice', color: 'error' })
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-10 space-y-6">
    <!-- Top Success Header -->
    <div class="text-center space-y-2">
      <div class="size-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-check-circle-2" class="size-9" />
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
        Pembayaran Lunas!
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        Berikut adalah Kartu Invoice resmi beserta kredensial dan peraturan khusus produk kamu.
      </p>
    </div>

    <!-- INVOICE CARD (Captured by html-to-image) -->
    <div
      ref="notaRef"
      class="rounded-3xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#0b1623] p-6 sm:p-7 shadow-2xl space-y-6"
    >
      <!-- Invoice Header -->
      <div class="flex items-center justify-between pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="size-9 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-slate-950 font-black text-xs">
            ZX
          </div>
          <div>
            <p class="font-extrabold text-sm text-slate-900 dark:text-white">ZXRSA STORE</p>
            <p class="text-[11px] text-slate-400">Digital Invoice &amp; Warranty Card</p>
          </div>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          SETTLEMENT · LUNAS
        </span>
      </div>

      <!-- Schema Fields Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-[#0f1d2e] p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
        <div>
          <span class="text-slate-400 block">Order ID</span>
          <span class="font-mono font-bold text-slate-900 dark:text-white">{{ order.orderId }}</span>
        </div>
        <div>
          <span class="text-slate-400 block">Waktu Transaksi</span>
          <span class="font-medium text-slate-900 dark:text-white">{{ formatDate(order.createdAt) }}</span>
        </div>
        <div>
          <span class="text-slate-400 block">Produk &amp; Paket</span>
          <span class="font-bold text-cyan-600 dark:text-cyan-300">{{ order.productName }} ({{ order.duration }})</span>
        </div>
        <div>
          <span class="text-slate-400 block">Total Dibayar</span>
          <span class="font-extrabold text-slate-900 dark:text-white">{{ formatRupiah(order.amount) }}</span>
        </div>
        <div>
          <span class="text-slate-400 block">Email Pembeli</span>
          <span class="font-medium text-slate-900 dark:text-white break-all">{{ order.customerEmail }}</span>
        </div>
        <div>
          <span class="text-slate-400 block">Tipe Pengiriman</span>
          <span class="font-medium text-slate-900 dark:text-white">
            {{ order.isCustomGmail ? `Custom Gmail (${order.customGmailAccount})` : 'Akun Instan (Ready Stock)' }}
          </span>
        </div>
      </div>

      <!-- Credentials Box -->
      <div v-if="order.deliveredAccountData" class="space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Kredensial Akun Kamu
          </p>
          <span class="text-[11px] text-slate-400">Klik tombol salin untuk copy</span>
        </div>

        <div class="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 dark:bg-[#0f2236] p-4 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-[11px] text-slate-400">Email / Username</p>
              <p class="font-mono font-bold text-sm text-slate-900 dark:text-white break-all">{{ accountEmail }}</p>
            </div>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-cyan-300 hover:border-cyan-400 shrink-0 cursor-pointer"
              @click="copyText(accountEmail, 'Email')"
            >
              {{ copiedField === 'Email' ? 'Tersalin!' : 'Salin' }}
            </button>
          </div>

          <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <div class="min-w-0">
              <p class="text-[11px] text-slate-400">Password / Detail Akses</p>
              <p class="font-mono font-bold text-sm text-slate-900 dark:text-white break-all">{{ accountPassword }}</p>
            </div>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-cyan-300 hover:border-cyan-400 shrink-0 cursor-pointer"
              @click="copyText(accountPassword, 'Password')"
            >
              {{ copiedField === 'Password' ? 'Tersalin!' : 'Salin' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Custom Gmail Pending Fulfillment Notice -->
      <div v-else-if="order.isCustomGmail" class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
        <div class="flex items-center gap-2 text-amber-500 font-bold text-xs">
          <UIcon name="i-lucide-clock" class="size-4" />
          <span>Sedang Diproses dalam Antrian Custom Gmail</span>
        </div>
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Pesanan untuk akun <strong>{{ order.customGmailAccount }}</strong> sudah masuk ke antrian prioritas admin. Undangan atau aktivasi akan dikirim ke <strong>{{ order.customerEmail }}</strong> maksimal 1x24 jam.
        </p>
      </div>

      <!-- Product-Specific Rules Box (`rules` column from `products` table) -->
      <div class="rounded-2xl border border-rose-500/25 bg-rose-500/5 dark:bg-rose-950/20 p-4 space-y-2.5">
        <div class="flex items-center gap-2 text-rose-500 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
          <UIcon name="i-lucide-shield-alert" class="size-4" />
          <span>Peraturan &amp; Ketentuan Garansi — {{ order.productName }}</span>
        </div>
        <ul class="space-y-1.5 list-disc list-inside text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <li v-for="(rule, idx) in formattedRules" :key="idx">{{ rule }}</li>
        </ul>
      </div>
    </div>

    <!-- Bottom Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-3">
      <button
        type="button"
        :disabled="isDownloading"
        class="flex-1 py-3.5 px-5 rounded-xl font-bold text-sm bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
        @click="downloadInvoicePng"
      >
        <UIcon :name="isDownloading ? 'i-lucide-loader-circle' : 'i-lucide-download'" class="size-4" :class="{ 'animate-spin': isDownloading }" />
        <span>Simpan Kartu Invoice (PNG)</span>
      </button>
      <button
        type="button"
        class="py-3.5 px-5 rounded-xl font-semibold text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer"
        @click="emit('back-to-shop')"
      >
        <UIcon name="i-lucide-store" class="size-4" />
        <span>Kembali ke Beranda Toko</span>
      </button>
    </div>
  </div>
</template>
