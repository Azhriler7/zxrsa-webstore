<script setup lang="ts">
interface TransactionAdmin {
  id: string
  status: string
  customerEmail: string
  customGmailAccount: string | null
  amount: number
  createdAt: string
  deliveredAccountData: string | null
  variant: {
    isCustomGmail: boolean
    duration: string
    product: { name: string }
  }
}

definePageMeta({
  middleware: ['admin'],
  layout: 'admin',
})

const toast = useToast()
const activeTab = ref<'queue' | 'all'>('queue')
const searchQuery = ref('')

const { data: allTransactions, refresh } = await useFetch<TransactionAdmin[]>('/api/admin/transactions')

const queueList = computed(() =>
  (allTransactions.value ?? []).filter(tx => tx.status === 'settlement' && !tx.deliveredAccountData)
)

const filteredTransactions = computed(() => {
  const base = activeTab.value === 'queue' ? queueList.value : (allTransactions.value ?? [])
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return base
  return base.filter(
    tx =>
      tx.id.toLowerCase().includes(q) ||
      tx.customerEmail.toLowerCase().includes(q) ||
      (tx.customGmailAccount ?? '').toLowerCase().includes(q) ||
      (tx.variant?.product?.name ?? '').toLowerCase().includes(q)
  )
})

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

// Modal Fulfill & Confirmation State
const selectedTx = ref<TransactionAdmin | null>(null)
const accountDataInput = ref('')
const isFulfillModalOpen = ref(false)
const isConfirmSendOpen = ref(false)
const isSubmitting = ref(false)

function openFulfillModal(tx: TransactionAdmin) {
  selectedTx.value = tx
  accountDataInput.value = tx.customGmailAccount ? `${tx.customGmailAccount}:Aktif-SudahDiinvite` : ''
  isFulfillModalOpen.value = true
}

function requestConfirmSend() {
  if (!accountDataInput.value.includes(':')) {
    toast.add({ title: 'Format wajib email:password atau email:status', color: 'error' })
    return
  }
  isConfirmSendOpen.value = true
}

async function executeSendAccount() {
  if (!selectedTx.value) return
  isSubmitting.value = true
  try {
    await $fetch(`/api/admin/transactions/${selectedTx.value.id}/complete`, {
      method: 'POST',
      body: { accountData: accountDataInput.value.trim() },
    })
    toast.add({ title: 'Akun berhasil disimpan & dikirim ke Invoice!', color: 'success' })
    isConfirmSendOpen.value = false
    isFulfillModalOpen.value = false
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Gagal mengirim akun', description: e?.data?.message, color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <span class="text-xs font-bold uppercase tracking-widest text-cyan-500">HALAMAN 2/3 · TRANSAKSI &amp; ANTRIAN</span>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
          Pesanan &amp; Antrian Custom Gmail
        </h1>
      </div>

      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari Order ID, Email, Produk..."
        class="w-full sm:w-72 px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-[#0b1623] border border-slate-200 dark:border-slate-800"
      />
    </div>

    <!-- Switch Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
        :class="
          activeTab === 'queue'
            ? 'bg-cyan-400 text-slate-950'
            : 'bg-white dark:bg-[#0b1623] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
        "
        @click="activeTab = 'queue'"
      >
        <UIcon name="i-lucide-clock" class="size-4" />
        <span>Antrian Custom Gmail / Belum Terkirim</span>
        <span class="px-2 py-0.5 rounded-full text-[11px] bg-slate-950/15 font-extrabold">
          {{ queueList.length }}
        </span>
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
        :class="
          activeTab === 'all'
            ? 'bg-cyan-400 text-slate-950'
            : 'bg-white dark:bg-[#0b1623] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
        "
        @click="activeTab = 'all'"
      >
        <UIcon name="i-lucide-history" class="size-4" />
        <span>Semua Riwayat Pesanan ({{ allTransactions?.length ?? 0 }})</span>
      </button>
    </div>

    <!-- List Pesanan -->
    <div v-if="filteredTransactions.length === 0" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1623] p-12 text-center text-sm text-slate-400">
      Tidak ada data pesanan pada tab ini.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="tx in filteredTransactions"
        :key="tx.id"
        class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1623] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="space-y-1.5">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
              :class="{
                'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30': tx.status === 'settlement',
                'bg-amber-500/15 text-amber-400 border border-amber-500/30': tx.status === 'pending',
                'bg-rose-500/15 text-rose-400 border border-rose-500/30': tx.status !== 'settlement' && tx.status !== 'pending',
              }"
            >
              {{ tx.status }}
            </span>
            <span class="font-mono text-xs text-slate-400">{{ tx.id }}</span>
            <span class="text-xs text-slate-400">· {{ tx.createdAt?.slice(0, 16) }}</span>
          </div>

          <p class="font-bold text-base text-slate-900 dark:text-white">
            {{ tx.variant?.product?.name }} — {{ tx.variant?.duration }}
          </p>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Nota: <strong class="text-slate-800 dark:text-slate-200">{{ tx.customerEmail }}</strong></span>
            <span v-if="tx.customGmailAccount" class="text-cyan-500 font-semibold">
              Target Custom Gmail: {{ tx.customGmailAccount }}
            </span>
          </div>

          <p v-if="tx.deliveredAccountData" class="text-xs font-mono text-emerald-500 pt-1">
            ✓ Terkirim: {{ tx.deliveredAccountData }}
          </p>
          <p v-else-if="tx.status === 'settlement'" class="text-xs font-semibold text-amber-500 pt-1">
            ⚠ Menunggu pengiriman akun / aktivasi Custom Gmail oleh Admin
          </p>
        </div>

        <div class="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <p class="font-extrabold text-lg text-cyan-600 dark:text-cyan-400">{{ formatRupiah(tx.amount) }}</p>
          <button
            v-if="tx.status === 'settlement' && !tx.deliveredAccountData"
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center gap-1.5 cursor-pointer"
            @click="openFulfillModal(tx)"
          >
            <UIcon name="i-lucide-send" class="size-3.5" />
            <span>Proses &amp; Kirim Akun</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Input Kredensial Pengiriman Manual -->
    <Teleport to="body">
      <div
        v-if="isFulfillModalOpen && selectedTx"
        class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
        @click.self="isFulfillModalOpen = false"
      >
        <div class="w-full max-w-md rounded-2xl border border-slate-200 dark:border-cyan-500/25 bg-white dark:bg-[#0d1826] p-6 space-y-4 shadow-2xl">
          <h3 class="font-bold text-lg text-slate-900 dark:text-white">
            Kirim Akun / Selesaikan Antrian Gmail
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Order: <span class="font-mono">{{ selectedTx.id }}</span> ({{ selectedTx.variant?.product?.name }})
          </p>

          <div class="space-y-1.5">
            <label class="block text-xs font-semibold">Format Kredensial (email:password / email:status)</label>
            <input
              v-model="accountDataInput"
              type="text"
              placeholder="email@gmail.com:password123"
              class="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 dark:bg-[#0f1d2e] border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-medium text-slate-500"
              @click="isFulfillModalOpen = false"
            >
              Batal
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 cursor-pointer"
              @click="requestConfirmSend"
            >
              Simpan &amp; Kirim
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirmation Modal sebelum update database -->
    <ConfirmModal
      v-model:open="isConfirmSendOpen"
      title="Konfirmasi Pengiriman Akun"
      :description="`Kredensial '${accountDataInput}' akan disimpan ke database untuk pesanan ${selectedTx?.id} dan langsung tampil pada Kartu Invoice pembeli. Lanjutkan?`"
      confirm-label="Ya, Simpan ke Database"
      :loading="isSubmitting"
      @confirm="executeSendAccount"
    />
  </div>
</template>
