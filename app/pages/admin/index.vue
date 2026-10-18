<script setup lang="ts">
interface VariantStockSummary {
  id: string
  duration: string
  price: number
  isActive: boolean
  isCustomGmail: boolean
  stockCount: number
}

interface ProductStockSummary {
  id: string
  name: string
  image: string | null
  isActive: boolean
  variants: VariantStockSummary[]
}

interface StatsData {
  antrianManual: number
  omzetTotal: number
  pendapatanHariIni: number
  pendapatanBulanKemarin: number
  totalTransaksiSukses: number
  stokSisa: number
  revenueByProductMonth: Record<string, Record<string, Record<string, number>>>
  productsStockSummary: ProductStockSummary[]
}

definePageMeta({
  middleware: ['admin'],
  layout: 'admin',
})

const { data: stats, refresh } = await useFetch<StatsData>('/api/admin/stats')

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

// ─── Chart Controls: Searchable Product Dropdown + Month/Year Filter ───
const isProductDropdownOpen = ref(false)
const chartProductSearch = ref('')
const selectedChartProductId = ref<string>('ALL')
const selectedMonthYear = ref<string>('2026-10')
const focusedDayDetail = ref<{ day: string; amount: number } | null>(null)

const monthYearOptions = [
  { value: '2026-10', label: 'Okt 2026' },
  { value: '2026-09', label: 'Sept 2026' },
  { value: '2026-08', label: 'Agu 2026' },
  { value: '2026-07', label: 'Jul 2026' },
]

const productOptionsForChart = computed(() => {
  const list = stats.value?.productsStockSummary ?? []
  const q = chartProductSearch.value.trim().toLowerCase()
  const base = [{ id: 'ALL', name: 'Semua Produk (Gabungan)' }, ...list.map(p => ({ id: p.id, name: p.name }))]
  if (!q) return base
  return base.filter(item => item.name.toLowerCase().includes(q))
})

const selectedChartProductLabel = computed(() => {
  if (selectedChartProductId.value === 'ALL') return 'Semua Produk (Gabungan)'
  return stats.value?.productsStockSummary?.find(p => p.id === selectedChartProductId.value)?.name ?? 'Pilih Produk'
})

const daysInSelectedMonth = computed(() => {
  const [y, m] = selectedMonthYear.value.split('-').map(Number)
  if (!y || !m) return 30
  return new Date(y, m, 0).getDate()
})

const currentMonthDailyMap = computed(() => {
  const mapByProd = stats.value?.revenueByProductMonth?.[selectedChartProductId.value] ?? {}
  return mapByProd[selectedMonthYear.value] ?? {}
})

const hasChartData = computed(() => {
  const values = Object.values(currentMonthDailyMap.value)
  return values.some(v => Number(v) > 0)
})

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: any = null

async function renderChart() {
  if (!chartRef.value) return
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  if (!hasChartData.value) return

  const totalDays = daysInSelectedMonth.value
  const labels: string[] = []
  const dataPoints: number[] = []
  const shortMonth = monthYearOptions.find(m => m.value === selectedMonthYear.value)?.label.split(' ')[0] ?? ''

  for (let d = 1; d <= totalDays; d++) {
    const dd = String(d).padStart(2, '0')
    labels.push(`${d} ${shortMonth}`)
    dataPoints.push(Number(currentMonthDailyMap.value[dd] ?? 0))
  }

  chartInstance = new Chart(chartRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Pendapatan (IDR)',
          data: dataPoints,
          backgroundColor: dataPoints.map((_, idx) =>
            focusedDayDetail.value?.day === labels[idx] ? '#10b981' : 'rgba(0, 240, 255, 0.72)'
          ),
          hoverBackgroundColor: '#00f0ff',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (_, elements) => {
        if (elements && elements.length > 0) {
          const idx = elements[0]!.index
          focusedDayDetail.value = {
            day: labels[idx]!,
            amount: dataPoints[idx]!,
          }
          renderChart()
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Pendapatan: ${formatRupiah(Number(ctx.raw ?? 0))}`,
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (val) => `Rp${Number(val) / 1000}rb`,
          },
        },
      },
    },
  })
}

watch([selectedChartProductId, selectedMonthYear, () => stats.value], () => {
  focusedDayDetail.value = null
  nextTick(() => renderChart())
})

onMounted(() => {
  renderChart()
})

// ─── Right-Side Vertical Stock Card: 2 Search Bars (Produk & Paket) ───
const stockSearchProduct = ref('')
const stockSearchPackage = ref('')

watch(stockSearchProduct, (val) => {
  if (!val.trim()) {
    stockSearchPackage.value = ''
  }
})

const filteredStockProducts = computed(() => {
  const list = stats.value?.productsStockSummary ?? []
  const prodQ = stockSearchProduct.value.trim().toLowerCase()
  const pkgQ = stockSearchPackage.value.trim().toLowerCase()

  return list
    .filter(p => !prodQ || p.name.toLowerCase().includes(prodQ) || p.id.toLowerCase().includes(prodQ))
    .map(p => ({
      ...p,
      variants: p.variants.filter(v => !pkgQ || v.duration.toLowerCase().includes(pkgQ)),
    }))
    .filter(p => p.variants.length > 0)
})

// ─── Bottom Square Low-Stock Alert Card (<10 Red, <25 Yellow, >=25 Hidden) ───
const lowStockAlerts = computed(() => {
  const alerts: Array<{
    productId: string
    productName: string
    duration: string
    stockCount: number
    level: 'red' | 'yellow'
  }> = []

  for (const prod of stats.value?.productsStockSummary ?? []) {
    for (const v of prod.variants) {
      if (v.isCustomGmail) continue
      if (v.stockCount < 10) {
        alerts.push({
          productId: prod.id,
          productName: prod.name,
          duration: v.duration,
          stockCount: v.stockCount,
          level: 'red',
        })
      } else if (v.stockCount < 25) {
        alerts.push({
          productId: prod.id,
          productName: prod.name,
          duration: v.duration,
          stockCount: v.stockCount,
          level: 'yellow',
        })
      }
    }
  }
  return alerts.sort((a, b) => a.stockCount - b.stockCount)
})
</script>

<template>
  <div class="space-y-6 animate-fade-up">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <span class="text-xs font-mono font-bold uppercase tracking-widest text-cyan-600 dark:text-[#00f0ff]">// HALAMAN 1/3 · OVERVIEW</span>
        <h1 class="text-2xl font-extrabold text-zinc-900 dark:text-white mt-0.5">Dashboard Admin</h1>
      </div>
      <button
        type="button"
        class="cyber-btn-secondary px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 flex items-center gap-2 self-start cursor-pointer"
        @click="refresh()"
      >
        <UIcon name="i-lucide-refresh-cw" class="size-3.5" />
        <span>Segarkan Data</span>
      </button>
    </div>

    <!-- 5 Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="cyber-card-interactive rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-zinc-400">ANTRIAN CUSTOM GMAIL</span>
          <UIcon name="i-lucide-clock" class="size-4 text-amber-400" />
        </div>
        <p class="text-2xl font-mono font-black text-amber-500">{{ stats?.antrianManual ?? 0 }} Pesanan</p>
        <NuxtLink to="/admin/transactions" class="text-[11px] font-mono text-amber-400 hover:underline block">Proses antrian →</NuxtLink>
      </div>

      <div class="cyber-card-interactive rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-zinc-400">PENDAPATAN TOTAL</span>
          <UIcon name="i-lucide-wallet" class="size-4 text-[#00f0ff]" />
        </div>
        <p class="text-xl sm:text-2xl font-mono font-black text-zinc-900 dark:text-[#00f0ff]">
          {{ formatRupiah(stats?.omzetTotal ?? 0) }}
        </p>
        <p class="text-[11px] text-emerald-500 font-mono">Akumulasi Settlement</p>
      </div>

      <div class="cyber-card-interactive rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-zinc-400">PENDAPATAN HARI INI</span>
          <UIcon name="i-lucide-trending-up" class="size-4 text-emerald-400" />
        </div>
        <p class="text-xl sm:text-2xl font-mono font-black text-emerald-500">
          {{ formatRupiah(stats?.pendapatanHariIni ?? 0) }}
        </p>
        <p class="text-[11px] text-zinc-400 font-mono">Real-time Hari Ini</p>
      </div>

      <div class="cyber-card-interactive rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-zinc-400">PENDAPATAN BULAN KEMARIN</span>
          <UIcon name="i-lucide-calendar-check" class="size-4 text-violet-400" />
        </div>
        <p class="text-xl sm:text-2xl font-mono font-black text-zinc-900 dark:text-white">
          {{ formatRupiah(stats?.pendapatanBulanKemarin ?? 0) }}
        </p>
        <p class="text-[11px] text-zinc-400 font-mono">Rekap Bulan Lalu</p>
      </div>

      <div class="cyber-card-interactive rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-zinc-400">TOTAL TRANSAKSI SUKSES</span>
          <UIcon name="i-lucide-check-circle-2" class="size-4 text-cyan-400" />
        </div>
        <p class="text-2xl font-mono font-black text-zinc-900 dark:text-white">
          {{ stats?.totalTransaksiSukses ?? 0 }}
        </p>
        <p class="text-[11px] text-zinc-400 font-mono">Transaksi Lunas</p>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- LEFT 8 COLS: Daily Revenue Chart with Searchable Product Dropdown & Month/Year Filter -->
      <div class="lg:col-span-8 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/10">
          <div>
            <h2 class="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white">
              Grafik Pendapatan Harian Per Produk
            </h2>
            <p class="text-xs text-zinc-400">
              Klik batang grafik untuk fokus detail tanggal · Geser ke samping pada layar mobile (30 hari).
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Searchable & Scrollable Product Dropdown -->
            <div class="relative">
              <button
                type="button"
                class="px-3.5 py-2 rounded-xl text-xs font-mono font-bold border border-zinc-200 dark:border-[#00f0ff]/40 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-[#00f0ff] flex items-center gap-2 cursor-pointer"
                @click="isProductDropdownOpen = !isProductDropdownOpen"
              >
                <span class="truncate max-w-[150px]">{{ selectedChartProductLabel }}</span>
                <span>▾</span>
              </button>

              <div
                v-if="isProductDropdownOpen"
                class="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-200 dark:border-[#00f0ff]/40 bg-white dark:bg-zinc-900 shadow-2xl p-2 z-30 space-y-2"
              >
                <input
                  v-model="chartProductSearch"
                  type="text"
                  placeholder="Ketik cari produk..."
                  class="w-full px-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 focus:outline-none focus:border-[#00f0ff]"
                />
                <div class="max-h-44 overflow-y-auto space-y-1 custom-scrollbar">
                  <button
                    v-for="item in productOptionsForChart"
                    :key="item.id"
                    type="button"
                    class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    :class="
                      selectedChartProductId === item.id
                        ? 'bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200'
                    "
                    @click="selectedChartProductId = item.id; isProductDropdownOpen = false"
                  >
                    {{ item.name }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Month / Year Filter -->
            <select
              v-model="selectedMonthYear"
              class="px-3 py-2 rounded-xl text-xs font-mono font-bold border border-zinc-200 dark:border-white/15 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white cursor-pointer"
            >
              <option v-for="m in monthYearOptions" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Focused Day Badge -->
        <div
          v-if="focusedDayDetail"
          class="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between text-xs animate-fade-up"
        >
          <span class="font-mono text-emerald-400 font-bold">
            ● FOCUSED DATA · Tanggal {{ focusedDayDetail.day }} ({{ selectedChartProductLabel }})
          </span>
          <span class="font-mono font-extrabold text-sm text-emerald-400">
            {{ formatRupiah(focusedDayDetail.amount) }}
          </span>
        </div>

        <!-- Empty State Notification -->
        <div
          v-if="!hasChartData"
          class="h-72 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col items-center justify-center p-6 text-center space-y-2"
        >
          <UIcon name="i-lucide-bar-chart-3" class="size-10 text-zinc-400" />
          <p class="font-bold text-sm text-zinc-900 dark:text-white">
            Belum Ada Data Pendapatan
          </p>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
            Belum ditemukan riwayat transaksi lunas untuk <strong>{{ selectedChartProductLabel }}</strong> pada periode <strong>{{ monthYearOptions.find(m => m.value === selectedMonthYear)?.label }}</strong>.
          </p>
        </div>

        <!-- Horizontally Scrollable 30-Day Chart Wrapper -->
        <div v-else class="overflow-x-auto custom-scrollbar pb-2">
          <div class="min-w-[760px] h-72">
            <canvas ref="chartRef" />
          </div>
        </div>
      </div>

      <!-- RIGHT 4 COLS: Stacked Vertical Stock Overview Card + Square Low-Stock Alert Card -->
      <div class="lg:col-span-4 space-y-6">
        <!-- 1. Vertical Rectangular Stock Overview Card -->
        <div class="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 flex flex-col h-[360px]">
          <div class="space-y-3 pb-3 border-b border-zinc-100 dark:border-white/10 shrink-0">
            <div class="flex items-center justify-between">
              <h3 class="font-extrabold text-sm text-zinc-900 dark:text-white">Sisa Stok Setiap Paket</h3>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/5 text-[#00f0ff]">SCROLLABLE</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="stockSearchProduct"
                type="text"
                placeholder="1. Cari Produk..."
                class="w-full px-2.5 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 focus:outline-none focus:border-[#00f0ff]"
              />
              <input
                v-model="stockSearchPackage"
                type="text"
                :disabled="!stockSearchProduct.trim()"
                placeholder="2. Cari Paket..."
                class="w-full px-2.5 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 focus:outline-none focus:border-[#00f0ff] disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto space-y-3 pt-3 pr-1 custom-scrollbar">
            <div v-if="filteredStockProducts.length === 0" class="text-center py-8 text-xs text-zinc-400">
              Produk atau paket tidak ditemukan.
            </div>

            <div
              v-for="prod in filteredStockProducts"
              :key="prod.id"
              class="p-3 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-950/60 space-y-2"
            >
              <div class="flex items-center gap-2.5">
                <div class="size-8 rounded-lg bg-zinc-900 border border-[#00f0ff]/30 flex items-center justify-center font-mono font-black text-xs text-[#00f0ff] shrink-0">
                  {{ prod.name.slice(0, 2).toUpperCase() }}
                </div>
                <p class="font-bold text-xs text-zinc-900 dark:text-white truncate">{{ prod.name }}</p>
              </div>

              <div class="space-y-1 pl-1">
                <div
                  v-for="v in prod.variants"
                  :key="v.id"
                  class="flex items-center justify-between text-[11px] font-mono py-1 border-t border-zinc-200/50 dark:border-white/5"
                >
                  <span class="text-zinc-600 dark:text-zinc-300 truncate pr-2">{{ v.duration }}</span>
                  <span
                    v-if="v.isCustomGmail"
                    class="px-1.5 py-0.5 rounded bg-cyan-500/10 text-[#00f0ff] font-bold"
                  >
                    Custom Gmail
                  </span>
                  <span
                    v-else
                    class="px-1.5 py-0.5 rounded font-bold"
                    :class="
                      v.stockCount < 10
                        ? 'bg-rose-500/15 text-rose-400'
                        : v.stockCount < 25
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                    "
                  >
                    {{ v.stockCount }} akun
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Bottom Square Scrollable Low-Stock Notification Card (<10 Red, <25 Yellow, >=25 Hidden) -->
        <div class="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 flex flex-col h-[250px]">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/10 shrink-0">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-bell-ring" class="size-4 text-rose-400" />
              <h3 class="font-extrabold text-sm text-zinc-900 dark:text-white">Pemberitahuan Stok</h3>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold">
              {{ lowStockAlerts.length }} ALERT
            </span>
          </div>

          <div class="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1 custom-scrollbar">
            <div v-if="lowStockAlerts.length === 0" class="h-full flex flex-col items-center justify-center text-center text-xs text-emerald-400 font-mono">
              <span>✓ Semua paket memiliki stok aman (≥ 25 akun).</span>
            </div>

            <div
              v-for="(item, idx) in lowStockAlerts"
              :key="idx"
              class="p-3 rounded-xl border text-xs space-y-1"
              :class="
                item.level === 'red'
                  ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                  : 'border-amber-500/50 bg-amber-500/10 text-amber-300'
              "
            >
              <div class="flex items-center justify-between font-mono text-[10px] font-extrabold uppercase">
                <span>{{ item.level === 'red' ? '🚨 HAMPIR HABIS (< 10)' : '⚠️ STOK MENIPIS (< 25)' }}</span>
                <span>SISA: {{ item.stockCount }}</span>
              </div>
              <p class="font-medium leading-snug text-zinc-800 dark:text-zinc-100">
                Produk <strong>{{ item.productName }}</strong> paket <strong>{{ item.duration }}</strong> tersisa <strong>{{ item.stockCount }} akun</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
