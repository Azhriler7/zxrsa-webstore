<script setup lang="ts">
interface StockItem {
  id: number
  variantId: string
  accountData: string
  isSold: boolean
  soldAt: string | null
}

interface ProductVariantAdmin {
  id: string
  duration: string
  price: number
  isActive?: boolean
  isPromoActive?: boolean
  discountAmount?: number | null
  promoPrice: number | null
  promoStartDate?: string | null
  promoDayOfWeek: string | null
  promoSpecificDate: string | null
  promoRepeatYearly?: boolean
  isCustomGmail: boolean
  stockCount?: number
  stocks?: StockItem[]
}

interface ProductAdmin {
  id: string
  name: string
  description: string | null
  image: string | null
  promoBadge: string | null
  rules: string | null
  isActive: boolean
  variants: ProductVariantAdmin[]
}

interface EditableVariantMapItem {
  id: string
  duration: string
  price: number
  isActive: boolean
  isPromoActive: boolean
  discountAmount: number
  promoStartDate: string
  recurrenceMode: 'none' | 'weekly' | 'yearly'
  promoDayOfWeek: string
  promoRepeatYearly: boolean
  isCustomGmail: boolean
}

definePageMeta({
  middleware: ['admin'],
  layout: 'admin',
})

const toast = useToast()
const { data: products, refresh } = await useFetch<ProductAdmin[]>('/api/admin/products')

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const todayDateStr = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
})

const daysOfWeekOptions = [
  { value: 'Monday',    label: 'Setiap Senin'  },
  { value: 'Tuesday',   label: 'Setiap Selasa' },
  { value: 'Wednesday', label: 'Setiap Rabu'   },
  { value: 'Thursday',  label: 'Setiap Kamis'  },
  { value: 'Friday',    label: 'Setiap Jumat'  },
  { value: 'Saturday',  label: 'Setiap Sabtu'  },
  { value: 'Sunday',    label: 'Setiap Minggu' },
]

// ─── Universal Confirmation Modal State ───────────────────────
const confirmState = reactive<{
  open: boolean
  title: string
  description: string
  variant: 'primary' | 'danger' | 'warning'
  loading: boolean
  onConfirm: () => Promise<void>
}>({
  open: false,
  title: '',
  description: '',
  variant: 'primary',
  loading: false,
  onConfirm: async () => {},
})

function askConfirm(opts: {
  title: string
  description: string
  variant?: 'primary' | 'danger' | 'warning'
  action: () => Promise<void>
}) {
  confirmState.title = opts.title
  confirmState.description = opts.description
  confirmState.variant = opts.variant ?? 'primary'
  confirmState.onConfirm = async () => {
    confirmState.loading = true
    try {
      await opts.action()
      confirmState.open = false
    } finally {
      confirmState.loading = false
    }
  }
  confirmState.open = true
}

// ─── 1. Unified Modal Tambah / Edit Produk + Dynamic Package Map ───
const isProductModalOpen = ref(false)
const isEditingProduct = ref(false)
const modalDateError = ref('')

const productForm = reactive<{
  id: string
  name: string
  description: string
  image: string
  promoBadge: string
  rules: string
  isActive: boolean
  variants: EditableVariantMapItem[]
}>({
  id: '',
  name: '',
  description: '',
  image: '',
  promoBadge: '',
  rules: '',
  isActive: true,
  variants: [],
})

function createBlankVariantItem(index = 1): EditableVariantMapItem {
  return {
    id: `${productForm.id || 'pkg'}-${Date.now().toString().slice(-4)}-${index}`,
    duration: index === 1 ? '1 Bulan Sharing' : `${index} Bulan Ready`,
    price: 35000,
    isActive: true,
    isPromoActive: false,
    discountAmount: 5000,
    promoStartDate: todayDateStr.value,
    recurrenceMode: 'none',
    promoDayOfWeek: 'Friday',
    promoRepeatYearly: false,
    isCustomGmail: false,
  }
}

function addPackageToMap() {
  productForm.variants.push(createBlankVariantItem(productForm.variants.length + 1))
}

function removePackageFromMap(idx: number) {
  productForm.variants.splice(idx, 1)
}

function openNewProductModal() {
  isEditingProduct.value = false
  modalDateError.value = ''
  Object.assign(productForm, {
    id: '',
    name: '',
    description: '',
    image: '',
    promoBadge: '',
    rules: '1. Dilarang mengganti password atau profil pengguna lain.\n2. Gunakan maksimal pada 1 perangkat sesuai paket.\n3. Klaim garansi wajib menyertakan Kartu Invoice ini.',
    isActive: true,
    variants: [createBlankVariantItem(1)],
  })
  isProductModalOpen.value = true
}

function openEditProductModal(p: ProductAdmin) {
  isEditingProduct.value = true
  modalDateError.value = ''
  Object.assign(productForm, {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    image: p.image ?? '',
    promoBadge: p.promoBadge ?? '',
    rules: p.rules ?? '',
    isActive: p.isActive ?? true,
    variants: p.variants.map((v, i) => {
      const hasPromo = Boolean(v.isPromoActive || (v.promoPrice && v.promoPrice < v.price))
      const disc = v.discountAmount ?? (v.promoPrice ? Math.max(0, v.price - v.promoPrice) : 5000)
      const recMode: 'none' | 'weekly' | 'yearly' = v.promoRepeatYearly
        ? 'yearly'
        : v.promoDayOfWeek
          ? 'weekly'
          : 'none'
      return {
        id: v.id || `${p.id}-${i}`,
        duration: v.duration,
        price: v.price,
        isActive: v.isActive !== false,
        isPromoActive: hasPromo,
        discountAmount: disc,
        promoStartDate: v.promoStartDate || todayDateStr.value,
        recurrenceMode: recMode,
        promoDayOfWeek: v.promoDayOfWeek || 'Friday',
        promoRepeatYearly: Boolean(v.promoRepeatYearly),
        isCustomGmail: Boolean(v.isCustomGmail),
      }
    }),
  })
  isProductModalOpen.value = true
}

function submitProductAndPackagesForm() {
  modalDateError.value = ''
  if (!productForm.id.trim() || !productForm.name.trim()) {
    toast.add({ title: 'ID dan Nama Produk wajib diisi', color: 'error' })
    return
  }
  if (productForm.variants.length === 0) {
    toast.add({ title: 'Tambahkan minimal 1 paket harga pada produk ini', color: 'error' })
    return
  }

  for (const v of productForm.variants) {
    if (!v.duration.trim() || v.price <= 0) {
      toast.add({ title: 'Nama paket dan harga normal wajib diisi dengan benar', color: 'error' })
      return
    }
    if (v.isPromoActive) {
      if (!v.promoStartDate || v.promoStartDate < todayDateStr.value) {
        modalDateError.value = `Tanggal diskon untuk paket "${v.duration}" tidak boleh sebelum hari ini (${todayDateStr.value}).`
        return
      }
    }
  }

  const mappedVariantsPayload = productForm.variants.map(v => {
    const afterDiscount = Math.max(0, Number(v.price) - Number(v.discountAmount || 0))
    const mmdd = v.promoStartDate ? v.promoStartDate.slice(5, 10) : null
    return {
      id: v.id,
      duration: v.duration.trim(),
      price: Number(v.price),
      isActive: v.isActive,
      isPromoActive: v.isPromoActive,
      discountAmount: v.isPromoActive ? Number(v.discountAmount) : null,
      promoPrice: v.isPromoActive ? afterDiscount : null,
      promoStartDate: v.isPromoActive ? v.promoStartDate : null,
      promoDayOfWeek: v.isPromoActive && v.recurrenceMode === 'weekly' ? v.promoDayOfWeek : null,
      promoSpecificDate: v.isPromoActive && v.recurrenceMode === 'yearly' ? mmdd : null,
      promoRepeatYearly: v.isPromoActive && v.recurrenceMode === 'yearly',
      isCustomGmail: v.isCustomGmail,
    }
  })

  askConfirm({
    title: isEditingProduct.value ? 'Simpan Perubahan Produk & Daftar Paket?' : 'Tambah Produk & Daftar Paket Baru?',
    description: `Produk "${productForm.name}" beserta ${mappedVariantsPayload.length} paket harga dan peraturan Kartu Invoice akan disimpan ke database.`,
    action: async () => {
      if (isEditingProduct.value) {
        await $fetch(`/api/admin/products/${productForm.id}`, {
          method: 'PUT',
          body: {
            name: productForm.name,
            description: productForm.description || null,
            image: productForm.image || null,
            promoBadge: productForm.promoBadge || null,
            rules: productForm.rules || null,
            isActive: productForm.isActive,
            variants: mappedVariantsPayload,
          },
        })
        toast.add({ title: 'Produk, paket harga & aturan invoice diperbarui!', color: 'success' })
      } else {
        await $fetch('/api/admin/products', {
          method: 'POST',
          body: {
            ...productForm,
            variants: mappedVariantsPayload,
          },
        })
        toast.add({ title: 'Produk & paket baru berhasil ditambahkan!', color: 'success' })
      }
      isProductModalOpen.value = false
      await refresh()
    },
  })
}

function requestDeleteProduct(p: ProductAdmin) {
  askConfirm({
    title: `Hapus Produk "${p.name}"?`,
    description: `Seluruh varian paket dan stok akun di dalam produk "${p.name}" akan ikut terhapus secara permanen dari database.`,
    variant: 'danger',
    action: async () => {
      await $fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' })
      toast.add({ title: 'Produk dihapus', color: 'success' })
      await refresh()
    },
  })
}

// ─── 2. Modal Bulk Input Stok Massal (2 Dependent Search Bars: Produk -> Paket) ───
const isBulkOpen = ref(false)
const bulkProductSearch = ref('')
const bulkSelectedProductId = ref('')
const bulkPackageSearch = ref('')
const bulkSelectedVariantId = ref('')
const bulkRawInput = ref('')

const filteredBulkProducts = computed(() => {
  const q = bulkProductSearch.value.trim().toLowerCase()
  const list = products.value ?? []
  if (!q) return list
  return list.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
})

const selectedBulkProductObj = computed(() =>
  (products.value ?? []).find(p => p.id === bulkSelectedProductId.value) ?? null
)

const filteredBulkPackages = computed(() => {
  if (!selectedBulkProductObj.value) return []
  const q = bulkPackageSearch.value.trim().toLowerCase()
  return selectedBulkProductObj.value.variants
    .filter(v => !v.isCustomGmail)
    .filter(v => !q || v.duration.toLowerCase().includes(q))
})

function openBulkForVariant(productId?: string, variantId?: string) {
  bulkProductSearch.value = ''
  bulkPackageSearch.value = ''
  bulkSelectedProductId.value = productId || ''
  bulkSelectedVariantId.value = variantId || ''
  bulkRawInput.value = ''
  isBulkOpen.value = true
}

function selectBulkProduct(prodId: string) {
  bulkSelectedProductId.value = prodId
  bulkSelectedVariantId.value = ''
  bulkPackageSearch.value = ''
}

const validStockLinesCount = computed(() =>
  bulkRawInput.value.split('\n').filter(l => l.trim().includes(':') && l.trim().length > 3).length
)

function submitBulkStock() {
  if (!bulkSelectedProductId.value) {
    toast.add({ title: 'Pilih produk terlebih dahulu pada kolom pertama', color: 'error' })
    return
  }
  if (!bulkSelectedVariantId.value || validStockLinesCount.value === 0) {
    toast.add({ title: 'Pilih paket dan masukkan minimal 1 baris email:password', color: 'error' })
    return
  }
  askConfirm({
    title: `Tambahkan ${validStockLinesCount.value} Stok Akun ke Database?`,
    description: `Sebanyak ${validStockLinesCount.value} akun siap pakai akan dimasukkan ke stok paket terpilih.`,
    action: async () => {
      const { inserted } = await $fetch<{ inserted: number }>('/api/admin/stocks/bulk', {
        method: 'POST',
        body: { variantId: bulkSelectedVariantId.value, rawInput: bulkRawInput.value },
      })
      toast.add({ title: `${inserted} akun berhasil ditambahkan!`, color: 'success' })
      isBulkOpen.value = false
      await refresh()
    },
  })
}

function requestDeleteStockItem(st: StockItem) {
  askConfirm({
    title: 'Hapus Kredensial Stok Ini?',
    description: `Akun "${st.accountData}" akan dihapus dari stok database.`,
    variant: 'danger',
    action: async () => {
      await $fetch(`/api/admin/stocks/${st.id}`, { method: 'DELETE' })
      toast.add({ title: 'Stok akun dihapus', color: 'success' })
      await refresh()
    },
  })
}
</script>

<template>
  <div class="space-y-6 animate-fade-up">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <span class="text-xs font-mono font-bold uppercase tracking-widest text-cyan-600 dark:text-[#00f0ff]">
          // HALAMAN 3/3 · MANAJEMEN STOK, PRODUK &amp; PAKET HARGA
        </span>
        <h1 class="text-2xl font-extrabold text-zinc-900 dark:text-white mt-0.5">
          Manajemen Stok &amp; Katalog Produk
        </h1>
        <p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Tambah/edit produk beserta daftar paket harga dinamis, sakelar paket aktif/nonaktif, penjadwalan promo diskon, dan stok akun.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          class="cyber-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 dark:border-[#00f0ff]/40 bg-white dark:bg-[#00f0ff]/10 text-zinc-900 dark:text-[#00f0ff] flex items-center gap-2 cursor-pointer"
          @click="openBulkForVariant()"
        >
          <UIcon name="i-lucide-database-zap" class="size-4" />
          <span>+ Input Stok Massal</span>
        </button>
        <button
          type="button"
          class="cyber-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 flex items-center gap-2 cursor-pointer"
          @click="openNewProductModal"
        >
          <UIcon name="i-lucide-plus" class="size-4" />
          <span>+ Tambah Produk &amp; Paket</span>
        </button>
      </div>
    </div>

    <!-- Product Cards List -->
    <div v-if="!products?.length" class="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-12 text-center text-sm text-zinc-400">
      Belum ada produk. Klik "+ Tambah Produk &amp; Paket" untuk memulai.
    </div>

    <div v-else class="space-y-5">
      <div
        v-for="product in products"
        :key="product.id"
        class="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-5 shadow-sm"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/10">
          <div class="flex items-start gap-4">
            <div class="size-12 rounded-xl bg-zinc-900 border border-[#00f0ff]/35 flex items-center justify-center font-mono font-black text-[#00f0ff] text-sm shrink-0">
              {{ product.name.slice(0, 2).toUpperCase() }}
            </div>
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-extrabold text-lg text-zinc-900 dark:text-white">{{ product.name }}</h2>
                <span class="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  ID: {{ product.id }}
                </span>
                <span
                  v-if="product.promoBadge"
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00f0ff]/15 text-[#00f0ff]"
                >
                  {{ product.promoBadge }}
                </span>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  :class="product.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'"
                >
                  {{ product.isActive ? 'PRODUK AKTIF' : 'PRODUK NONAKTIF' }}
                </span>
              </div>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">
                {{ product.description || 'Tidak ada deskripsi' }}
              </p>
              <div class="pt-1">
                <p class="text-[11px] font-mono font-semibold text-rose-400">Peraturan di Invoice Card (`products.rules`):</p>
                <p class="text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-line line-clamp-2">
                  {{ product.rules || 'Belum diatur.' }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              class="cyber-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold border border-zinc-300 dark:border-[#00f0ff]/40 text-zinc-900 dark:text-[#00f0ff] flex items-center gap-1.5 cursor-pointer"
              @click="openEditProductModal(product)"
            >
              <UIcon name="i-lucide-sliders-horizontal" class="size-3.5" />
              <span>Edit Produk, Paket &amp; Promo</span>
            </button>
            <button
              type="button"
              class="p-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              @click="requestDeleteProduct(product)"
            >
              <UIcon name="i-lucide-trash-2" class="size-4" />
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="v in product.variants"
            :key="v.id"
            class="rounded-xl border p-4 space-y-3 transition-all"
            :class="
              v.isActive === false
                ? 'border-zinc-200/50 dark:border-white/5 bg-zinc-100/40 dark:bg-zinc-950/30 opacity-60'
                : 'border-zinc-200 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-950/60'
            "
          >
            <div class="flex items-start justify-between gap-2">
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="font-bold text-sm text-zinc-900 dark:text-white">{{ v.duration }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                    :class="v.isActive !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'"
                  >
                    {{ v.isActive !== false ? 'ON' : 'OFF' }}
                  </span>
                  <span v-if="v.isCustomGmail" class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00f0ff]/15 text-[#00f0ff]">
                    Custom Gmail
                  </span>
                  <span v-if="v.isPromoActive || v.promoPrice" class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400">
                    PROMO ON
                  </span>
                </div>

                <div class="flex items-baseline gap-2">
                  <span class="font-mono font-extrabold text-sm text-cyan-600 dark:text-[#00f0ff]">
                    {{ formatRupiah(v.price) }}
                  </span>
                  <span v-if="v.promoPrice" class="text-xs font-mono text-emerald-400 font-bold">
                    → Sesudah Diskon: {{ formatRupiah(v.promoPrice) }}
                  </span>
                </div>

                <p v-if="v.promoStartDate || v.promoDayOfWeek || v.promoSpecificDate" class="text-[10px] font-mono text-zinc-400">
                  Jadwal Promo:
                  <span v-if="v.promoStartDate">Mulai {{ v.promoStartDate }}</span>
                  <span v-if="v.promoDayOfWeek"> · Tiap {{ v.promoDayOfWeek }}</span>
                  <span v-if="v.promoRepeatYearly && v.promoSpecificDate"> · Tahunan ({{ v.promoSpecificDate }})</span>
                </p>
              </div>

              <button
                v-if="!v.isCustomGmail"
                type="button"
                class="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-[#00f0ff]/15 text-cyan-700 dark:text-[#00f0ff] border border-[#00f0ff]/30 cursor-pointer shrink-0"
                @click="openBulkForVariant(product.id, v.id)"
              >
                + Stok ({{ v.stockCount ?? 0 }})
              </button>
            </div>

            <div v-if="!v.isCustomGmail && v.stocks?.length" class="pt-2 border-t border-zinc-200/60 dark:border-white/10 space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
              <div
                v-for="st in v.stocks.filter(s => !s.isSold)"
                :key="st.id"
                class="flex items-center justify-between text-[11px] font-mono bg-white dark:bg-zinc-900 px-2.5 py-1 rounded border border-zinc-200/60 dark:border-white/10"
              >
                <span class="truncate">{{ st.accountData }}</span>
                <button
                  type="button"
                  class="text-rose-400 hover:text-rose-500 ml-2 cursor-pointer"
                  @click="requestDeleteStockItem(st)"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 1: UNIFIED ADD/EDIT PRODUCT + DYNAMIC PACKAGE MAP + PROMO -->
    <Teleport to="body">
      <div
        v-if="isProductModalOpen"
        class="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/80 backdrop-blur-md"
        @click.self="isProductModalOpen = false"
      >
        <div class="w-full max-w-4xl rounded-2xl border border-zinc-200 dark:border-[#00f0ff]/35 bg-white dark:bg-zinc-900 p-5 sm:p-7 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar animate-fade-up">
          <div class="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00f0ff]">PRODUCT &amp; PACKAGE MAP BUILDER</span>
              <h3 class="font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white">
                {{ isEditingProduct ? `Edit Produk & Paket — ${productForm.name}` : 'Tambah Produk & Daftar Paket Baru' }}
              </h3>
            </div>
            <button type="button" class="p-2 text-zinc-400 hover:text-white cursor-pointer" @click="isProductModalOpen = false">✕</button>
          </div>

          <div class="space-y-4">
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-[#00f0ff]">
              A. Informasi Produk &amp; Peraturan Kartu Invoice
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-semibold">ID Produk (Slug)</label>
                <input
                  v-model="productForm.id"
                  :disabled="isEditingProduct"
                  type="text"
                  placeholder="netflix"
                  class="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 disabled:opacity-50"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold">Nama Produk</label>
                <input
                  v-model="productForm.name"
                  type="text"
                  placeholder="Netflix Premium UHD"
                  class="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold">Badge Label (Opsional)</label>
                <input
                  v-model="productForm.promoBadge"
                  type="text"
                  placeholder="BEST SELLER"
                  class="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-semibold">Deskripsi Singkat</label>
                <input
                  v-model="productForm.description"
                  type="text"
                  placeholder="Streaming 4K Ultra HD bergaransi penuh..."
                  class="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10"
                />
              </div>
              <div class="space-y-1 flex flex-col justify-end">
                <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold cursor-pointer">
                  <input v-model="productForm.isActive" type="checkbox" class="size-4 accent-[#00f0ff]" />
                  <span>Tampilkan Produk Ini di Katalog Pembeli</span>
                </label>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-cyan-600 dark:text-[#00f0ff]">
                Peraturan Produk di Kartu Invoice (`products.rules`)
              </label>
              <textarea
                v-model="productForm.rules"
                rows="3"
                class="w-full px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-[#00f0ff]/30"
                placeholder="1. Dilarang mengubah password akun..."
              />
            </div>
          </div>

          <div class="space-y-4 pt-4 border-t border-zinc-200 dark:border-white/10">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-[#00f0ff]">
                  B. Daftar Paket Harga &amp; Promo Diskon ({{ productForm.variants.length }} Paket)
                </h4>
                <p class="text-[11px] text-zinc-400">
                  Anda bebas menambahkan paket ke bawah sebanyak apapun. Setiap paket memiliki sakelar ON/OFF masing-masing.
                </p>
              </div>
              <button
                type="button"
                class="cyber-btn-primary px-3.5 py-2 rounded-lg text-xs font-bold bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 cursor-pointer"
                @click="addPackageToMap"
              >
                + Tambah Paket Baru ke Bawah
              </button>
            </div>

            <p v-if="modalDateError" class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-bold text-rose-400">
              ⚠️ {{ modalDateError }}
            </p>

            <div class="space-y-4">
              <div
                v-for="(pkg, idx) in productForm.variants"
                :key="pkg.id"
                class="rounded-xl border p-4 sm:p-5 space-y-4 transition-all"
                :class="
                  pkg.isActive
                    ? 'border-zinc-300 dark:border-white/15 bg-zinc-50/70 dark:bg-zinc-950/80'
                    : 'border-zinc-200/50 dark:border-white/5 bg-zinc-100/40 dark:bg-zinc-950/30 opacity-65'
                "
              >
                <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200/70 dark:border-white/10">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-white dark:bg-[#00f0ff]/15 dark:text-[#00f0ff]">
                      PAKET #{{ idx + 1 }}
                    </span>
                    <span class="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">{{ pkg.duration || 'Paket Baru' }}</span>
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      class="px-3 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer"
                      :class="
                        pkg.isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-white/10'
                      "
                      @click="pkg.isActive = !pkg.isActive"
                    >
                      {{ pkg.isActive ? '● PAKET NYALA (ON)' : '○ PAKET MATI (OFF)' }}
                    </button>

                    <button
                      type="button"
                      class="px-3 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer"
                      :class="
                        pkg.isPromoActive
                          ? 'bg-[#00f0ff] text-zinc-950 border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                          : 'bg-zinc-900 text-zinc-300 border-white/15 hover:border-[#00f0ff]/50'
                      "
                      @click="pkg.isPromoActive = !pkg.isPromoActive"
                    >
                      {{ pkg.isPromoActive ? '★ PROMO DISKON: ON' : '☆ PROMO DISKON: OFF' }}
                    </button>

                    <button
                      v-if="productForm.variants.length > 1"
                      type="button"
                      class="px-2.5 py-1 rounded-lg text-[11px] font-mono text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                      @click="removePackageFromMap(idx)"
                    >
                      Hapus Paket
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="space-y-1">
                    <label class="text-[11px] font-semibold">Nama Durasi Paket</label>
                    <input
                      v-model="pkg.duration"
                      type="text"
                      placeholder="1 Bulan Sharing"
                      class="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-semibold">Harga Normal (Rp)</label>
                    <input
                      v-model.number="pkg.price"
                      type="number"
                      min="0"
                      step="1000"
                      class="w-full px-3 py-2 rounded-lg text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
                    />
                  </div>
                  <div class="space-y-1 flex flex-col justify-end">
                    <label class="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs cursor-pointer">
                      <input v-model="pkg.isCustomGmail" type="checkbox" class="size-4 accent-[#00f0ff]" />
                      <span>Varian Custom Gmail Pembeli</span>
                    </label>
                  </div>
                </div>

                <div
                  v-if="pkg.isPromoActive"
                  class="p-4 rounded-xl border border-[#00f0ff]/40 bg-[#00f0ff]/[0.05] space-y-4 animate-fade-up"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-mono font-bold text-[#00f0ff] uppercase">
                      ⚡ KONFIGURASI DISKON &amp; JADWAL OTOMATIS ({{ pkg.duration }})
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div class="space-y-1">
                      <label class="text-[11px] font-semibold">Mau Diskon Berapa? (Nominal Rp)</label>
                      <input
                        v-model.number="pkg.discountAmount"
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="Contoh: 7000"
                        class="w-full px-3 py-2 rounded-lg text-xs font-mono bg-white dark:bg-zinc-900 border border-[#00f0ff]/40"
                      />
                    </div>

                    <div class="sm:col-span-2 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span class="text-[10px] font-mono text-zinc-400 block">HARGA SEBELUM DISKON</span>
                        <span class="text-sm font-mono font-bold text-zinc-400 line-through">{{ formatRupiah(pkg.price || 0) }}</span>
                      </div>
                      <div class="font-mono text-xs text-emerald-400 font-bold">
                        − {{ formatRupiah(pkg.discountAmount || 0) }}
                      </div>
                      <div class="text-right">
                        <span class="text-[10px] font-mono text-[#00f0ff] block">HARGA SESUDAH DISKON</span>
                        <span class="text-lg font-mono font-black text-emerald-400">
                          {{ formatRupiah(Math.max(0, (pkg.price || 0) - (pkg.discountAmount || 0))) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div class="space-y-1">
                      <label class="text-[11px] font-semibold">
                        Tanggal Diskon Diterapkan <span class="text-rose-400">(Wajib ≥ Hari Ini)</span>
                      </label>
                      <input
                        v-model="pkg.promoStartDate"
                        type="date"
                        :min="todayDateStr"
                        class="w-full px-3 py-2 rounded-lg text-xs font-mono bg-white dark:bg-zinc-900 border"
                        :class="pkg.promoStartDate && pkg.promoStartDate < todayDateStr ? 'border-red-500 text-red-500' : 'border-zinc-200 dark:border-white/10'"
                      />
                      <p v-if="pkg.promoStartDate && pkg.promoStartDate < todayDateStr" class="text-[11px] text-red-500 font-semibold">
                        Tidak boleh memasukkan tanggal sebelum hari ini ({{ todayDateStr }}).
                      </p>
                    </div>

                    <div class="space-y-1.5">
                      <label class="text-[11px] font-semibold block">Mode Perulangan Diskon Otomatis</label>
                      <div class="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          class="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border cursor-pointer"
                          :class="pkg.recurrenceMode === 'none' ? 'bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 border-transparent' : 'border-zinc-300 dark:border-white/10 text-zinc-500'"
                          @click="pkg.recurrenceMode = 'none'; pkg.promoRepeatYearly = false"
                        >
                          Tanpa Perulangan
                        </button>
                        <button
                          type="button"
                          class="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border cursor-pointer"
                          :class="pkg.recurrenceMode === 'weekly' ? 'bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 border-transparent' : 'border-zinc-300 dark:border-white/10 text-zinc-500'"
                          @click="pkg.recurrenceMode = 'weekly'; pkg.promoRepeatYearly = false"
                        >
                          Ulangi Tiap Hari (Mingguan)
                        </button>
                        <button
                          type="button"
                          class="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border cursor-pointer"
                          :class="pkg.recurrenceMode === 'yearly' ? 'bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 border-transparent' : 'border-zinc-300 dark:border-white/10 text-zinc-500'"
                          @click="pkg.recurrenceMode = 'yearly'; pkg.promoRepeatYearly = true"
                        >
                          Ulangi Setiap Tahun
                        </button>
                      </div>

                      <div v-if="pkg.recurrenceMode === 'weekly'" class="pt-1">
                        <select
                          v-model="pkg.promoDayOfWeek"
                          class="w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-900 border border-[#00f0ff]/40"
                        >
                          <option v-for="d in daysOfWeekOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
                        </select>
                      </div>

                      <p v-else-if="pkg.recurrenceMode === 'yearly'" class="text-[11px] font-mono text-emerald-400 pt-1">
                        ✓ Diskon otomatis menyala setiap tahun pada tanggal &amp; bulan ({{ pkg.promoStartDate ? pkg.promoStartDate.slice(5, 10) : 'MM-DD' }}).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2.5 pt-4 border-t border-zinc-200 dark:border-white/10">
            <button type="button" class="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 cursor-pointer" @click="isProductModalOpen = false">
              Batal
            </button>
            <button
              type="button"
              class="cyber-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 cursor-pointer"
              @click="submitProductAndPackagesForm"
            >
              Simpan Produk &amp; Seluruh Paket
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL 2: INPUT STOK MASSAL (2 SEARCH BARS + ATURAN PENULISAN) -->
    <Teleport to="body">
      <div
        v-if="isBulkOpen"
        class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md"
        @click.self="isBulkOpen = false"
      >
        <div class="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-[#00f0ff]/35 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-up">
          <div class="flex items-center justify-between">
            <h3 class="font-extrabold text-lg text-zinc-900 dark:text-white">Input Stok Kredensial Massal</h3>
            <button type="button" class="text-zinc-400 hover:text-white text-sm cursor-pointer" @click="isBulkOpen = false">✕</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10">
            <div class="space-y-1.5">
              <label class="text-[11px] font-mono font-bold text-[#00f0ff]">1. CARI &amp; PILIH PRODUK</label>
              <input
                v-model="bulkProductSearch"
                type="text"
                placeholder="Ketik nama produk..."
                class="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
              />
              <div class="max-h-28 overflow-y-auto space-y-1 pt-1 custom-scrollbar">
                <button
                  v-for="p in filteredBulkProducts"
                  :key="p.id"
                  type="button"
                  class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  :class="bulkSelectedProductId === p.id ? 'bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 font-bold' : 'hover:bg-zinc-200/60 dark:hover:bg-white/5'"
                  @click="selectBulkProduct(p.id)"
                >
                  {{ p.name }}
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[11px] font-mono font-bold" :class="bulkSelectedProductId ? 'text-[#00f0ff]' : 'text-zinc-500'">
                2. CARI &amp; PILIH PAKET
              </label>
              <input
                v-model="bulkPackageSearch"
                type="text"
                :disabled="!bulkSelectedProductId"
                :placeholder="bulkSelectedProductId ? 'Ketik durasi paket...' : 'Pilih produk dulu di kiri'"
                class="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <div v-if="!bulkSelectedProductId" class="py-6 text-center text-[11px] text-zinc-400 font-mono">
                🔒 Pilih produk terlebih dahulu
              </div>
              <div v-else class="max-h-28 overflow-y-auto space-y-1 pt-1 custom-scrollbar">
                <button
                  v-for="v in filteredBulkPackages"
                  :key="v.id"
                  type="button"
                  class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between"
                  :class="bulkSelectedVariantId === v.id ? 'bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 font-bold' : 'hover:bg-zinc-200/60 dark:hover:bg-white/5'"
                  @click="bulkSelectedVariantId = v.id"
                >
                  <span>{{ v.duration }}</span>
                  <span class="font-mono text-[10px] opacity-80">Stok: {{ v.stockCount ?? 0 }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold">Daftar Kredensial Akun</label>
            <textarea
              v-model="bulkRawInput"
              rows="5"
              placeholder="akun1@gmail.com:pass123&#10;akun2@gmail.com:pass456"
              class="w-full px-3 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10"
            />
            <p class="text-[11px] font-mono text-[#00f0ff]">{{ validStockLinesCount }} baris akun valid terdeteksi</p>
          </div>

          <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <p class="font-mono font-bold text-zinc-900 dark:text-[#00f0ff]">📌 ATURAN PENULISAN INPUT STOK MASSAL:</p>
            <p>1. Gunakan pemisah titik dua (<code class="font-mono text-emerald-400">email:password</code>) tanpa spasi di sekitar tanda titik dua.</p>
            <p>2. Satu baris hanya untuk <strong>1 akun</strong> (tekan Enter untuk akun berikutnya).</p>
            <p>3. Contoh: <code class="font-mono text-zinc-700 dark:text-zinc-200">netflix_vip01@zxrsa.com:SandiAman#99</code></p>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="px-4 py-2 rounded-xl text-xs text-zinc-400 cursor-pointer" @click="isBulkOpen = false">Batal</button>
            <button
              type="button"
              class="cyber-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 cursor-pointer"
              @click="submitBulkStock"
            >
              Simpan Stok ke Database
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmModal
      v-model:open="confirmState.open"
      :title="confirmState.title"
      :description="confirmState.description"
      :variant="confirmState.variant"
      :loading="confirmState.loading"
      @confirm="confirmState.onConfirm"
    />
  </div>
</template>
