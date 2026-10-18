<script setup lang="ts">
export interface VariantItem {
  id: string
  duration: string
  price: number
  promoPrice: number | null
  finalPrice: number
  isPromo: boolean
  stockCount: number
  isCustomGmail: boolean
}

export interface ProductItem {
  id: string
  name: string
  description: string | null
  image: string | null
  promoBadge: string | null
  rules?: string | null
  variants: VariantItem[]
}

const props = defineProps<{
  products: ProductItem[]
  loading?: boolean
  processing?: boolean
}>()

const emit = defineEmits<{
  'submit-checkout': [payload: {
    product: ProductItem
    variant: VariantItem
    customerEmail: string
    customGmailAccount?: string
  }]
  'validation-failed': [message: string]
}>()

const searchQuery = ref('')
const selectedProductId = ref<string>('')
const selectedVariantId = ref<string>('')
const customerEmail = ref('')
const emailTouched = ref(false)
const customGmailAccount = ref('')
const customGmailTouched = ref(false)
const agreedTerms = ref(false)
const isTermsModalOpen = ref(false)
const isConfirmModalOpen = ref(false)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const isCustomerEmailInvalid = computed(() => {
  if (!emailTouched.value && !customerEmail.value) return false
  return !EMAIL_REGEX.test(customerEmail.value.trim())
})

const isCustomGmailInvalid = computed(() => {
  if (!selectedVariant.value?.isCustomGmail) return false
  if (!customGmailTouched.value && !customGmailAccount.value) return false
  return !EMAIL_REGEX.test(customGmailAccount.value.trim())
})

const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.products
  return props.products.filter(
    p => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
  )
})

const selectedProduct = computed(() =>
  props.products.find(p => p.id === selectedProductId.value) ?? props.products[0] ?? null
)

const selectedVariant = computed(() => {
  if (!selectedProduct.value) return null
  return (
    selectedProduct.value.variants.find(v => v.id === selectedVariantId.value) ??
    selectedProduct.value.variants.find(v => v.stockCount > 0 || v.isCustomGmail) ??
    selectedProduct.value.variants[0] ??
    null
  )
})

watch(
  () => props.products,
  (list) => {
    if (list.length > 0 && !selectedProductId.value) {
      selectedProductId.value = list[0]!.id
      const firstAvail = list[0]!.variants.find(v => v.stockCount > 0 || v.isCustomGmail) ?? list[0]!.variants[0]
      if (firstAvail) selectedVariantId.value = firstAvail.id
    }
  },
  { immediate: true }
)

function selectProduct(product: ProductItem) {
  selectedProductId.value = product.id
  const firstAvail = product.variants.find(v => v.stockCount > 0 || v.isCustomGmail) ?? product.variants[0]
  selectedVariantId.value = firstAvail ? firstAvail.id : ''
}

function selectVariant(variant: VariantItem) {
  if (variant.stockCount === 0 && !variant.isCustomGmail) return
  selectedVariantId.value = variant.id
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

function handlePrePayClick() {
  emailTouched.value = true
  if (selectedVariant.value?.isCustomGmail) {
    customGmailTouched.value = true
  }

  if (!selectedProduct.value || !selectedVariant.value) {
    emit('validation-failed', 'Aksi Ditolak: Silakan pilih produk dan durasi paket terlebih dahulu.')
    return
  }
  if (!EMAIL_REGEX.test(customerEmail.value.trim())) {
    emit('validation-failed', 'Aksi Ditolak: Silakan masukkan format email yang benar sebelum melanjutkan.')
    return
  }
  if (selectedVariant.value.isCustomGmail && !EMAIL_REGEX.test(customGmailAccount.value.trim())) {
    emit('validation-failed', 'Aksi Ditolak: Silakan masukkan format email Custom Gmail yang benar.')
    return
  }
  if (!agreedTerms.value) {
    emit('validation-failed', 'Aksi Ditolak: Anda wajib menyetujui Syarat & Ketentuan terlebih dahulu.')
    return
  }
  isConfirmModalOpen.value = true
}

function confirmAndPay() {
  if (!selectedProduct.value || !selectedVariant.value) return
  isConfirmModalOpen.value = false
  emit('submit-checkout', {
    product: selectedProduct.value,
    variant: selectedVariant.value,
    customerEmail: customerEmail.value.trim(),
    customGmailAccount: selectedVariant.value.isCustomGmail ? customGmailAccount.value.trim() : undefined,
  })
}
</script>

<template>
  <section id="katalog" class="max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-8 animate-fade-up">
    <!-- Section Title & Search -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200/80 dark:border-white/10 pb-6">
      <div>
        <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-600 dark:text-[#00f0ff]">
          // 01. KATALOG &amp; CHECKOUT
        </span>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
          Pilih Paket &amp; Konfigurasi Akun
        </h2>
        <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Pilih aplikasi dan durasi paket di kiri, lalu periksa ringkasan pesanan di kanan sebelum membayar.
        </p>
      </div>

      <!-- Search Input -->
      <div class="w-full md:w-72 relative">
        <UIcon name="i-lucide-search" class="size-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari Netflix, Spotify, CapCut..."
          class="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-[#00f0ff] transition-colors"
        />
      </div>
    </div>

    <!-- Main 2-Column SPA Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Step 1, Step 2, Step 3 -->
      <div class="lg:col-span-8 space-y-6">
        <!-- STEP 1: Pilih Produk -->
        <div class="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 space-y-5 animate-fade-left">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="size-6 rounded bg-zinc-900 dark:bg-[#00f0ff]/15 text-white dark:text-[#00f0ff] font-mono font-bold text-xs flex items-center justify-center border border-transparent dark:border-[#00f0ff]/40">
                01
              </span>
              <h3 class="font-bold text-base text-zinc-900 dark:text-white">Pilih Aplikasi Digital</h3>
            </div>
            <span class="text-xs font-mono text-zinc-400">{{ filteredProducts.length }} PRODUK READY</span>
          </div>

          <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div v-for="n in 4" :key="n" class="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
          </div>

          <div v-else-if="filteredProducts.length === 0" class="text-center py-8 text-zinc-400 text-sm">
            Produk tidak ditemukan untuk kata kunci "{{ searchQuery }}".
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              v-for="prod in filteredProducts"
              :key="prod.id"
              type="button"
              class="cyber-card-interactive group text-left p-4 rounded-xl border flex items-start gap-3.5 relative cursor-pointer"
              :class="
                selectedProduct?.id === prod.id
                  ? 'cyber-card-selected border-zinc-900 dark:border-[#00f0ff] bg-zinc-100/90 dark:bg-[#00f0ff]/[0.08]'
                  : 'border-zinc-200 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-950/60 hover:border-zinc-400 dark:hover:border-[#00f0ff]/50'
              "
              @click="selectProduct(prod)"
            >
              <div class="size-11 rounded-lg bg-zinc-900 border border-zinc-300 dark:border-[#00f0ff]/35 flex items-center justify-center shrink-0 font-mono font-extrabold text-white dark:text-[#00f0ff] text-xs">
                {{ prod.name.slice(0, 2).toUpperCase() }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                    {{ prod.name }}
                  </p>
                  <span
                    v-if="prod.promoBadge"
                    class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-200 dark:bg-[#00f0ff]/15 text-zinc-800 dark:text-[#00f0ff] border border-zinc-300 dark:border-[#00f0ff]/30 shrink-0"
                  >
                    {{ prod.promoBadge }}
                  </span>
                </div>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                  {{ prod.description || 'Akun digital bergaransi penuh' }}
                </p>
                <p class="text-xs font-mono font-semibold text-cyan-700 dark:text-[#00f0ff] mt-2">
                  Mulai {{ formatRupiah(Math.min(...(prod.variants.map(v => v.finalPrice) || [0]))) }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <!-- STEP 2: Pilih Paket / Nominal Varian -->
        <div class="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 space-y-5 animate-fade-left">
          <div class="flex items-center gap-3">
            <span class="size-6 rounded bg-zinc-900 dark:bg-[#00f0ff]/15 text-white dark:text-[#00f0ff] font-mono font-bold text-xs flex items-center justify-center border border-transparent dark:border-[#00f0ff]/40">
              02
            </span>
            <h3 class="font-bold text-base text-zinc-900 dark:text-white">
              Pilih Durasi Paket — {{ selectedProduct?.name }}
            </h3>
          </div>

          <div v-if="!selectedProduct?.variants?.length" class="text-sm text-zinc-400 py-4 text-center">
            Belum ada paket varian aktif untuk produk ini.
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button
              v-for="v in selectedProduct.variants"
              :key="v.id"
              type="button"
              :disabled="v.stockCount === 0 && !v.isCustomGmail"
              class="cyber-card-interactive text-left p-4 rounded-xl border flex flex-col justify-between gap-3 relative cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              :class="
                selectedVariant?.id === v.id
                  ? 'cyber-card-selected border-zinc-900 dark:border-[#00f0ff] bg-zinc-100/90 dark:bg-[#00f0ff]/[0.08]'
                  : 'border-zinc-200 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-950/60 hover:border-zinc-400 dark:hover:border-[#00f0ff]/50'
              "
              @click="selectVariant(v)"
            >
              <div class="space-y-1">
                <div class="flex items-center justify-between gap-1">
                  <span class="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                    {{ v.duration }}
                  </span>
                  <span v-if="selectedVariant?.id === v.id" class="text-zinc-900 dark:text-[#00f0ff] font-mono font-bold text-xs">●</span>
                </div>
                <div class="flex items-baseline gap-1.5 pt-1">
                  <span class="font-mono font-extrabold text-base text-zinc-900 dark:text-[#00f0ff]">
                    {{ formatRupiah(v.finalPrice) }}
                  </span>
                  <span v-if="v.isPromo" class="text-[11px] font-mono text-zinc-400 line-through">
                    {{ formatRupiah(v.price) }}
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-white/10 text-[11px] font-mono">
                <span v-if="v.isCustomGmail" class="text-cyan-700 dark:text-[#00f0ff] font-semibold">
                  CUSTOM GMAIL
                </span>
                <span v-else-if="v.stockCount > 0" class="text-emerald-600 dark:text-emerald-400 font-semibold">
                  STOK: {{ v.stockCount }}
                </span>
                <span v-else class="text-rose-500 font-semibold">HABIS</span>
                <span v-if="v.isPromo" class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[9px] font-bold">PROMO</span>
              </div>
            </button>
          </div>
        </div>

        <!-- STEP 3: Verifikasi Email & Metode Pembayaran -->
        <div id="checkout-section" class="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 space-y-5 animate-fade-left">
          <div class="flex items-center gap-3">
            <span class="size-6 rounded bg-zinc-900 dark:bg-[#00f0ff]/15 text-white dark:text-[#00f0ff] font-mono font-bold text-xs flex items-center justify-center border border-transparent dark:border-[#00f0ff]/40">
              03
            </span>
            <h3 class="font-bold text-base text-zinc-900 dark:text-white">
              Verifikasi Email &amp; Metode Pembayaran
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Email Penerima Invoice <span class="text-red-500">*</span>
              </label>
              <input
                v-model="customerEmail"
                type="email"
                placeholder="nama@email.com"
                class="w-full px-3.5 py-2.5 rounded-lg text-sm bg-zinc-50 dark:bg-zinc-950 border text-zinc-900 dark:text-white focus:outline-none transition-all"
                :class="
                  isCustomerEmailInvalid
                    ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    : 'border-zinc-300 dark:border-white/10 focus:border-zinc-900 dark:focus:border-[#00f0ff]'
                "
                @input="emailTouched = true"
                @blur="emailTouched = true"
              />
              <p v-if="isCustomerEmailInvalid" class="text-xs font-medium text-red-500 pt-0.5">
                Silakan masukkan format email yang benar
              </p>
              <p class="text-[11px] text-zinc-400">Tautan Kartu Invoice dan garansi dikirim ke email ini.</p>
            </div>

            <div v-if="selectedVariant?.isCustomGmail" class="space-y-1.5">
              <label class="block text-xs font-semibold text-cyan-600 dark:text-[#00f0ff]">
                Akun Gmail Kamu (Custom Gmail) <span class="text-red-500">*</span>
              </label>
              <input
                v-model="customGmailAccount"
                type="email"
                placeholder="akunkamu@gmail.com"
                class="w-full px-3.5 py-2.5 rounded-lg text-sm bg-zinc-50 dark:bg-zinc-950 border text-zinc-900 dark:text-white focus:outline-none transition-all"
                :class="
                  isCustomGmailInvalid
                    ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    : 'border-zinc-300 dark:border-[#00f0ff]/40 focus:border-zinc-900 dark:focus:border-[#00f0ff]'
                "
                @input="customGmailTouched = true"
                @blur="customGmailTouched = true"
              />
              <p v-if="isCustomGmailInvalid" class="text-xs font-medium text-red-500 pt-0.5">
                Silakan masukkan format email yang benar
              </p>
              <p class="text-[11px] text-cyan-600 dark:text-[#00f0ff]">Paket ini akan diaktifkan langsung ke alamat Gmail ini.</p>
            </div>
          </div>

          <!-- Gerbang Pembayaran: Cukup tulis QRIS & ONLINE -->
          <div class="pt-1">
            <p class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Gerbang Pembayaran</p>
            <div class="p-3.5 rounded-lg border border-zinc-900 dark:border-[#00f0ff]/50 bg-zinc-100/80 dark:bg-[#00f0ff]/5 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="size-10 rounded-lg bg-zinc-900 dark:bg-[#00f0ff]/15 text-white dark:text-[#00f0ff] font-mono font-bold text-xs flex items-center justify-center border border-transparent dark:border-[#00f0ff]/30">
                  QRIS
                </div>
                <p class="text-sm font-extrabold text-zinc-900 dark:text-white tracking-wide">QRIS</p>
              </div>
              <span class="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Sticky Order Summary + Terms Checkbox + Tactile Bouncy Button -->
      <div class="lg:col-span-4 lg:sticky lg:top-20 space-y-4 animate-fade-right">
        <div class="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm dark:shadow-2xl space-y-5 relative overflow-hidden">
          <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent" />

          <div class="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-white/10">
            <h3 class="font-bold text-base text-zinc-900 dark:text-white">Ringkasan Pesanan</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-[#00f0ff] border border-zinc-200 dark:border-white/10">
              SPA CHECKOUT
            </span>
          </div>

          <div v-if="selectedProduct && selectedVariant" class="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-white/10 flex items-center gap-3">
            <div class="size-10 rounded-lg bg-zinc-900 dark:bg-[#00f0ff]/15 border border-transparent dark:border-[#00f0ff]/30 flex items-center justify-center font-mono font-extrabold text-white dark:text-[#00f0ff] text-xs shrink-0">
              {{ selectedProduct.name.slice(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="font-bold text-sm text-zinc-900 dark:text-white truncate">{{ selectedProduct.name }}</p>
              <p class="text-xs text-cyan-600 dark:text-[#00f0ff] font-mono">
                {{ selectedVariant.duration }} · {{ selectedVariant.isCustomGmail ? 'Custom Gmail' : 'Ready Stock' }}
              </p>
            </div>
          </div>

          <!-- Breakdown -->
          <div class="space-y-2.5 text-xs sm:text-sm">
            <div class="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Email Pembeli</span>
              <span class="font-mono font-medium text-zinc-900 dark:text-white truncate max-w-[175px]">
                {{ customerEmail || '—' }}
              </span>
            </div>
            <div v-if="selectedVariant?.isCustomGmail" class="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Target Gmail</span>
              <span class="font-mono font-medium text-cyan-600 dark:text-[#00f0ff] truncate max-w-[175px]">
                {{ customGmailAccount || '—' }}
              </span>
            </div>
            <div class="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Metode Bayar</span>
              <span class="font-mono font-medium text-zinc-900 dark:text-white">QRIS</span>
            </div>
            <div class="flex justify-between text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200/80 dark:border-white/10">
              <span>Harga Paket</span>
              <span class="font-mono font-medium text-zinc-900 dark:text-white">
                {{ formatRupiah(selectedVariant?.price ?? 0) }}
              </span>
            </div>
            <div v-if="selectedVariant?.isPromo" class="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Potongan Harga</span>
              <span class="font-mono font-semibold">
                -{{ formatRupiah((selectedVariant.price ?? 0) - (selectedVariant.finalPrice ?? 0)) }}
              </span>
            </div>
          </div>

          <!-- Total -->
          <div class="pt-3 border-t border-zinc-200 dark:border-white/10 flex items-baseline justify-between">
            <span class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Tagihan</span>
            <span class="text-2xl font-mono font-extrabold text-zinc-900 dark:text-[#00f0ff]">
              {{ formatRupiah(selectedVariant?.finalPrice ?? 0) }}
            </span>
          </div>

          <!-- Checkbox Syarat & Ketentuan -->
          <div class="pt-1">
            <label class="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                v-model="agreedTerms"
                type="checkbox"
                class="mt-0.5 size-4 rounded border-zinc-300 dark:border-zinc-700 accent-zinc-900 dark:accent-[#00f0ff] cursor-pointer"
              />
              <span class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Saya telah membaca dan menyetujui
                <button
                  type="button"
                  class="font-bold text-zinc-900 dark:text-[#00f0ff] underline hover:opacity-80 cursor-pointer"
                  @click.stop="isTermsModalOpen = true"
                >
                  Syarat &amp; Ketentuan
                </button>
                pembelian di ZXRSA STORE.
              </span>
            </label>
          </div>

          <!-- Tactile & Bouncy Cyber Pay Button with Loading Spinner -->
          <button
            type="button"
            :disabled="processing"
            class="cyber-btn-primary w-full py-3.5 px-5 rounded-lg font-bold text-sm bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 border border-transparent dark:border-[#00f0ff] dark:shadow-[0_0_20px_rgba(0,240,255,0.2)] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            @click="handlePrePayClick"
          >
            <svg v-if="processing" class="size-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
              <path class="opacity-95" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{{ processing ? 'Memproses Transaksi...' : 'Bayar Sekarang' }}</span>
            <span v-if="!processing" class="font-mono">→</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Pop-up Syarat & Ketentuan -->
    <TermsModal
      v-model:open="isTermsModalOpen"
      @accept="agreedTerms = true"
    />

    <!-- Modal Pop-up Konfirmasi Pesanan -->
    <ConfirmModal
      v-model:open="isConfirmModalOpen"
      title="Konfirmasi Pemesanan"
      :description="`Apakah data pesanan kamu sudah benar?

• Produk: ${selectedProduct?.name} (${selectedVariant?.duration})
• Email Invoice: ${customerEmail}
${selectedVariant?.isCustomGmail ? `• Custom Gmail: ${customGmailAccount}
` : ''}• Total Bayar: ${formatRupiah(selectedVariant?.finalPrice ?? 0)}

Pesanan akan dicatat dan kode QRIS akan segera dibuat.`"
      confirm-label="Ya, Buat QRIS Sekarang"
      cancel-label="Periksa Lagi"
      :loading="processing"
      @confirm="confirmAndPay"
    />
  </section>
</template>
