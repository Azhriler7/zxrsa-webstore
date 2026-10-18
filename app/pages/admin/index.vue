<script setup lang="ts">
// Fix: definisikan interface untuk data stats agar TS tahu shape-nya
interface StatsData {
  omzetTotal:  number
  stokSisa:    number
  revenueByDay: Record<string, number>
}

// Fix: pakai array untuk middleware, bukan string
definePageMeta({
  middleware: ['admin'],
  layout: 'admin',
})

// Fix: generic type untuk useFetch
const { data: stats } = await useFetch<StatsData>('/api/admin/stats')

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID',{ style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(n)

const chartRef = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  if (!chartRef.value || !stats.value?.revenueByDay) return
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  const labels = Object.keys(stats.value.revenueByDay).sort()
  // Fix: stats.value sudah punya type StatsData, TypeScript tidak error
  const data   = labels.map(d => stats.value!.revenueByDay[d] ?? 0)

  new Chart(chartRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Pendapatan (IDR)', data, backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 6 }],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  })
})
</script>

<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="size-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
            <UIcon name="i-lucide-trending-up" class="text-primary-500 size-6" />
          </div>
          <!-- Fix: stats.value sudah typed, omzetTotal dikenali -->
          <div><p class="text-sm text-gray-500">Total Omzet</p><p class="text-2xl font-bold">{{ formatRupiah(stats?.omzetTotal ?? 0) }}</p></div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="size-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
            <UIcon name="i-lucide-package" class="text-green-500 size-6" />
          </div>
          <div><p class="text-sm text-gray-500">Sisa Stok</p><p class="text-2xl font-bold">{{ stats?.stokSisa ?? 0 }} akun</p></div>
        </div>
      </UCard>
    </div>
    <UCard>
      <template #header><p class="font-semibold">Pendapatan 7 Hari Terakhir</p></template>
      <canvas ref="chartRef" height="120" />
    </UCard>
  </div>
</template>
