<script setup lang="ts">
interface TransactionAdmin {
  id:                   string
  status:               string
  customerEmail:        string
  customGmailAccount:   string | null
  amount:               number
  createdAt:            string
  deliveredAccountData: string | null
  variant: {
    isCustomGmail: boolean
    duration:      string
    product: { name: string }
  }
}

// Fix: pakai array untuk middleware
definePageMeta({
  middleware: ['admin'],
  layout: 'admin',
})

const toast     = useToast()
const activeTab = ref('all')

const { data: transactions, refresh } = await useFetch<TransactionAdmin[]>(
  () => `/api/admin/transactions${activeTab.value === 'unfulfilled' ? '?filter=unfulfilled' : ''}`,
)
watch(activeTab, () => refresh())

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID',{ style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(n)

const statusColor = (s: string): 'success'|'warning'|'error'|'neutral' => {
  const map: Record<string, 'success'|'warning'|'error'|'neutral'> = {
    settlement: 'success', pending: 'warning', deny: 'error', expire: 'neutral', cancel: 'neutral',
  }
  return map[s] ?? 'neutral'
}

const completeId          = ref('')
const completeAccountData = ref('')
const isCompleteOpen      = ref(false)
const isCompleteLoading   = ref(false)

function openComplete(txId: string) {
  completeId.value = txId; completeAccountData.value = ''; isCompleteOpen.value = true
}

async function submitComplete() {
  isCompleteLoading.value = true
  try {
    await $fetch(`/api/admin/transactions/${completeId.value}/complete`, {
      method: 'POST', body: { accountData: completeAccountData.value },
    })
    toast.add({ title: 'Selesai!', color: 'success' })
    isCompleteOpen.value = false; refresh()
  }
  catch (e: any) { toast.add({ title: 'Gagal', description: e?.data?.message, color: 'error' }) }
  finally { isCompleteLoading.value = false }
}

const tabs = [
  { label: 'Semua Transaksi', value: 'all'         },
  { label: 'Belum Terkirim',  value: 'unfulfilled' },
]
</script>

<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold">Transaksi</h1>
    <UTabs :items="tabs" v-model="activeTab" />

    <UAlert v-if="activeTab === 'unfulfilled'" color="warning" variant="subtle" icon="i-lucide-triangle-alert"
      title="Perlu Tindakan Manual"
      description="Transaksi lunas tapi akun belum terkirim (Custom Gmail atau stok habis mendadak)."
    />

    <div class="space-y-3">
      <UCard v-for="tx in transactions" :key="tx.id" class="text-sm">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <UBadge :color="statusColor(tx.status)" :label="tx.status.toUpperCase()" size="xs" />
              <span class="font-mono text-xs text-gray-400">{{ tx.id }}</span>
            </div>
            <p class="font-medium">{{ tx.variant?.product?.name }} – {{ tx.variant?.duration }}</p>
            <p class="text-gray-500">{{ tx.customerEmail }}</p>
            <p v-if="tx.customGmailAccount" class="text-blue-500 text-xs">Gmail: {{ tx.customGmailAccount }}</p>
            <p v-if="!tx.deliveredAccountData && tx.status === 'settlement'" class="text-orange-500 text-xs font-medium">
              ⚠ Akun belum terkirim
            </p>
          </div>
          <div class="text-right space-y-2">
            <p class="font-bold">{{ formatRupiah(tx.amount) }}</p>
            <p class="text-xs text-gray-400">{{ tx.createdAt?.slice(0, 10) }}</p>
            <UButton
              v-if="tx.status === 'settlement' && !tx.deliveredAccountData"
              size="xs" color="success" icon="i-lucide-check" label="Kirim Akun"
              @click="openComplete(tx.id)"
            />
          </div>
        </div>
      </UCard>
      <p v-if="!transactions?.length" class="text-center text-gray-400 py-8">Tidak ada transaksi.</p>
    </div>

    <UModal v-model:open="isCompleteOpen" title="Input Data Akun">
      <template #body>
        <div class="space-y-4 p-1">
          <UFormField label="Data Akun (email:password)" required>
            <UInput v-model="completeAccountData" placeholder="email@gmail.com:passwordnya" class="w-full font-mono" />
          </UFormField>
          <UButton block :loading="isCompleteLoading" :disabled="!completeAccountData.includes(':')"
            label="Simpan & Kirim" color="success" @click="submitComplete"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
