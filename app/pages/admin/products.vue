<script setup lang="ts">
// Fix: definisikan interface agar semua property dikenal TypeScript
interface ProductVariantAdmin {
  id:            string
  duration:      string
  price:         number
  promoPrice:    number | null
  isCustomGmail: boolean
}

interface ProductAdmin {
  id:          string
  name:        string
  image:       string | null
  promoBadge:  string | null
  variants:    ProductVariantAdmin[]
}

// Fix: pakai array untuk middleware
definePageMeta({
  middleware: ['admin'],
  layout: 'admin',
})

const toast = useToast()

// Fix: generic type — TypeScript sekarang tahu products adalah ProductAdmin[]
const { data: products, refresh } = await useFetch<ProductAdmin[]>('/api/admin/products')

const bulkVariantId = ref(''); const bulkRawInput = ref('')
const isBulkLoading = ref(false); const isBulkOpen = ref(false)

// Fix: karena products.value sudah typed sebagai ProductAdmin[] | null, flatMap bekerja
const variantOptions = computed(() =>
  products.value?.flatMap((p: ProductAdmin) =>
    p.variants.map((v: ProductVariantAdmin) => ({
      label: `${p.name} – ${v.duration}`,
      value: v.id,
    }))
  ) ?? []
)

async function submitBulk() {
  isBulkLoading.value = true
  try {
    const { inserted } = await $fetch<{ inserted: number }>('/api/admin/stocks/bulk', {
      method: 'POST', body: { variantId: bulkVariantId.value, rawInput: bulkRawInput.value },
    })
    toast.add({ title: `${inserted} akun ditambahkan!`, color: 'success' })
    bulkRawInput.value = ''; bulkVariantId.value = ''; isBulkOpen.value = false; refresh()
  }
  catch (e: any) { toast.add({ title: 'Gagal', description: e?.data?.message, color: 'error' }) }
  finally { isBulkLoading.value = false }
}

async function deleteProduct(id: string) {
  if (!confirm('Hapus produk + semua varian & stoknya?')) return
  await $fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
  toast.add({ title: 'Produk dihapus', color: 'success' }); refresh()
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Produk</h1>
      <div class="flex gap-2">
        <UButton icon="i-lucide-database" label="Bulk Input Stok" color="neutral" variant="outline" @click="isBulkOpen = true" />
        <UButton icon="i-lucide-plus"     label="Tambah Produk"   to="/admin/products/new" />
      </div>
    </div>

    <div class="space-y-4">
      <!-- Fix: product sekarang typed sebagai ProductAdmin, semua property dikenal -->
      <UCard v-for="product in products" :key="product.id">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <img v-if="product.image" :src="product.image" class="size-12 rounded-lg object-cover" />
            <div v-else class="size-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <UIcon name="i-lucide-package" class="text-gray-400" />
            </div>
            <div>
              <p class="font-semibold">{{ product.name }}</p>
              <p class="text-xs text-gray-500">{{ product.variants?.length ?? 0 }} varian</p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton icon="i-lucide-pencil"  size="sm" color="neutral" variant="ghost" :to="`/admin/products/${product.id}/edit`" />
            <UButton icon="i-lucide-trash-2" size="sm" color="error"   variant="ghost" @click="deleteProduct(product.id)" />
          </div>
        </div>
      </UCard>

      <p v-if="!products?.length" class="text-center text-gray-400 py-8 text-sm">Belum ada produk.</p>
    </div>

    <UModal v-model:open="isBulkOpen" title="Bulk Input Stok Akun">
      <template #body>
        <div class="space-y-4 p-1">
          <UAlert color="info" variant="subtle" icon="i-lucide-info"
            description="Format: email:password (satu baris = satu akun)"
          />
          <UFormField label="Pilih Varian" required>
            <USelect v-model="bulkVariantId" :items="variantOptions" placeholder="Pilih varian..." class="w-full" />
          </UFormField>
          <UFormField label="Data Akun" required>
            <UTextarea v-model="bulkRawInput" class="w-full font-mono text-sm" :rows="10"
              placeholder="email1@gmail.com:password1&#10;email2@gmail.com:password2"
            />
          </UFormField>
          <p class="text-xs text-gray-400">
            {{ bulkRawInput.split('\n').filter((l: string) => l.includes(':')).length }} baris valid
          </p>
          <UButton block :loading="isBulkLoading" :disabled="!bulkVariantId || !bulkRawInput"
            label="Simpan ke Database" icon="i-lucide-upload" @click="submitBulk"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
