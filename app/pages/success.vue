<script setup lang="ts">
import type { InvoiceOrderData } from '~/components/InvoiceCardStep.vue'

const route = useRoute()
const orderId = route.query.orderId as string
if (!orderId) navigateTo('/')

const { data: order, status, error } = await useFetch<InvoiceOrderData>(`/api/order/${orderId}`)
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#071018] text-slate-900 dark:text-slate-100">
    <UserNavbar @go-home="navigateTo('/')" />

    <div v-if="status === 'pending'" class="py-24 text-center space-y-3">
      <UIcon name="i-lucide-loader-circle" class="size-10 animate-spin text-cyan-400 mx-auto" />
      <p class="text-sm text-slate-400">Memuat Kartu Invoice...</p>
    </div>

    <div v-else-if="error || !order" class="max-w-md mx-auto px-4 py-20 text-center space-y-4">
      <div class="size-14 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-circle-x" class="size-8" />
      </div>
      <h1 class="text-xl font-bold">Transaksi Tidak Ditemukan atau Belum Lunas</h1>
      <p class="text-sm text-slate-400">Pastikan pembayaran QRIS kamu sudah selesai.</p>
      <UButton to="/" label="Kembali ke Toko" icon="i-lucide-arrow-left" />
    </div>

    <InvoiceCardStep
      v-else
      :order="order"
      @back-to-shop="navigateTo('/')"
    />
  </div>
</template>
