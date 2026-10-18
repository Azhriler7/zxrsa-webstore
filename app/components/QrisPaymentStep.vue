<script setup lang="ts">
const props = defineProps<{
  qrisData: {
    orderId: string
    qrisImageUrl: string
    amount: number
    expiresAt: string
    productName: string
    duration: string
    customerEmail: string
  }
  checkingStatus?: boolean
}>()

const emit = defineEmits<{
  'check-now': []
  'cancel': []
  'expired': []
}>()

const TOTAL_SECONDS = 300 // 5 Menit (300 detik)
const remainingSeconds = ref(TOTAL_SECONDS)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const formattedCountdown = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const progressPercent = computed(() => Math.max(0, (remainingSeconds.value / TOTAL_SECONDS) * 100))

onMounted(() => {
  countdownTimer = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value -= 1
      if (remainingSeconds.value === 0) {
        if (countdownTimer) clearInterval(countdownTimer)
        emit('expired')
      }
    }
  }, 1000)
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-12 animate-fade-up">
    <div class="rounded-2xl border border-zinc-200 dark:border-white/15 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent" />

      <div class="flex items-center justify-between gap-2">
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span class="size-2 rounded-full bg-amber-400 animate-ping" />
          MENUNGGU PEMBAYARAN QRIS
        </span>
        <span class="font-mono text-xs text-zinc-400">{{ qrisData.orderId }}</span>
      </div>

      <!-- 5-Minute Countdown Box -->
      <div class="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">BATAS WAKTU PEMBAYARAN (5 MENIT)</span>
          <span
            class="font-mono text-lg font-black tracking-wider"
            :class="remainingSeconds <= 60 ? 'text-rose-500 animate-pulse' : 'text-zinc-900 dark:text-[#00f0ff]'"
          >
            {{ formattedCountdown }}
          </span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            class="h-full transition-all duration-1000"
            :class="remainingSeconds <= 60 ? 'bg-rose-500' : 'bg-zinc-900 dark:bg-[#00f0ff]'"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
        <p class="text-[11px] text-zinc-400">
          Jika waktu 5 menit habis sebelum pembayaran terverifikasi, pesanan otomatis gagal dan kembali ke beranda.
        </p>
      </div>

      <div class="text-center space-y-1">
        <h2 class="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
          Scan QRIS untuk Menyelesaikan Pesanan
        </h2>
        <p class="text-xs sm:text-sm font-mono text-zinc-500 dark:text-zinc-400">
          {{ qrisData.productName }} ({{ qrisData.duration }}) · {{ qrisData.customerEmail }}
        </p>
      </div>

      <div class="flex flex-col items-center justify-center p-6 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 space-y-4">
        <div class="p-4 bg-white rounded-xl shadow-md border border-zinc-200">
          <img
            v-if="qrisData.qrisImageUrl"
            :src="qrisData.qrisImageUrl"
            alt="QRIS"
            class="size-60 object-contain"
          />
          <div v-else class="size-60 flex flex-col items-center justify-center text-zinc-400">
            <UIcon name="i-lucide-qr-code" class="size-24 text-zinc-800" />
            <span class="text-xs font-mono mt-2">QRIS</span>
          </div>
        </div>

        <div class="text-center">
          <p class="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Nominal Pembayaran Presisi</p>
          <p class="text-3xl font-mono font-black text-zinc-900 dark:text-[#00f0ff] mt-0.5">
            {{ formatRupiah(qrisData.amount) }}
          </p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          type="button"
          :disabled="checkingStatus"
          class="cyber-btn-primary flex-1 py-3.5 px-4 rounded-lg font-bold text-sm bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 flex items-center justify-center gap-2 cursor-pointer"
          @click="emit('check-now')"
        >
          <UIcon :name="checkingStatus ? 'i-lucide-loader-circle' : 'i-lucide-refresh-cw'" class="size-4" :class="{ 'animate-spin': checkingStatus }" />
          <span>Cek Status Pembayaran</span>
        </button>
        <button
          type="button"
          class="cyber-btn-secondary py-3.5 px-5 rounded-lg font-semibold text-sm border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 cursor-pointer"
          @click="emit('cancel')"
        >
          Batal &amp; Kembali
        </button>
      </div>
    </div>
  </div>
</template>
