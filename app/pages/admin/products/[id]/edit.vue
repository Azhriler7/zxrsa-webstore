<script setup lang="ts">
interface ProductVariantAdmin {
  id:                string
  duration:          string
  price:             number
  promoPrice:        number | null
  isCustomGmail:     boolean
  promoDayOfWeek:    string | null
  promoSpecificDate: string | null
}

interface ProductAdmin {
  id:          string
  name:        string
  description: string | null
  image:       string | null
  promoBadge:  string | null
  isActive:    boolean
  variants:    ProductVariantAdmin[]
}

// Fix: pakai array untuk middleware
definePageMeta({
  middleware: ['admin'],
  layout: 'admin',
})

const route     = useRoute()
const productId = route.params.id as string
const toast     = useToast()
const isSaving  = ref(false)

// Fix: generic type agar .find() bekerja
const { data: allProducts } = await useFetch<ProductAdmin[]>('/api/admin/products')

// Fix: typed computed agar tidak error pada .find()
const product = computed((): ProductAdmin | undefined =>
  allProducts.value?.find((p: ProductAdmin) => p.id === productId)
)

const p = computed((): ProductAdmin => product.value!)

const form = reactive({
  name:        '',
  description: '',
  image:       '',
  promoBadge:  '',
  isActive:    true,
})

watchEffect(() => {
  if (product.value) {
    form.name        = product.value.name        ?? ''
    form.description = product.value.description ?? ''
    form.image       = product.value.image       ?? ''
    form.promoBadge  = product.value.promoBadge  ?? ''
    form.isActive    = product.value.isActive     ?? true
  }
})

interface VariantForm {
  id:                string
  duration:          string
  price:             number
  promoPrice:        number | ''
  promoDayOfWeek:    string
  promoSpecificDate: string
  isCustomGmail:     boolean
}

const newVariant = reactive<VariantForm>({
  id:                '',
  duration:          '',
  price:             0,
  promoPrice:        '',
  promoDayOfWeek:    '',
  promoSpecificDate: '',
  isCustomGmail:     false,
})
const isAddingVariant = ref(false)

const dayOptions = [
  { label: '—',      value: ''          },
  { label: 'Senin',  value: 'Monday'    },
  { label: 'Selasa', value: 'Tuesday'   },
  { label: 'Rabu',   value: 'Wednesday' },
  { label: 'Kamis',  value: 'Thursday'  },
  { label: 'Jumat',  value: 'Friday'    },
  { label: 'Sabtu',  value: 'Saturday'  },
  { label: 'Minggu', value: 'Sunday'    },
]

async function saveProduct() {
  isSaving.value = true
  try {
    await $fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      body: {
        name:        form.name,
        description: form.description || null,
        image:       form.image       || null,
        promoBadge:  form.promoBadge  || null,
        isActive:    form.isActive,
      },
    })
    toast.add({ title: 'Produk diperbarui!', color: 'success' })
  }
  catch (e: any) { toast.add({ title: 'Gagal', description: e?.data?.message, color: 'error' }) }
  finally { isSaving.value = false }
}

async function deleteVariant(variantId: string) {
  if (!confirm('Hapus varian + stoknya?')) return
  await $fetch(`/api/admin/variants/${variantId}`, { method: 'DELETE' })
  toast.add({ title: 'Varian dihapus.', color: 'success' })
  await refreshNuxtData()
}

async function addVariant() {
  if (!newVariant.duration || !newVariant.price) {
    toast.add({ title: 'Durasi dan harga wajib diisi.', color: 'error' }); return
  }
  isAddingVariant.value = true
  try {
    await $fetch('/api/admin/variants', {
      method: 'POST',
      body: {
        id:                newVariant.id || `${productId}-${Date.now()}`,
        productId,
        duration:          newVariant.duration,
        price:             newVariant.price,
        promoPrice:        newVariant.promoPrice !== '' ? newVariant.promoPrice : undefined,
        promoDayOfWeek:    newVariant.promoDayOfWeek    || undefined,
        promoSpecificDate: newVariant.promoSpecificDate || undefined,
        isCustomGmail:     newVariant.isCustomGmail,
      },
    })
    toast.add({ title: 'Varian ditambahkan!', color: 'success' })
    Object.assign(newVariant, { id:'', duration:'', price:0, promoPrice:'', promoDayOfWeek:'', promoSpecificDate:'', isCustomGmail:false })
    await refreshNuxtData()
  }
  catch (e: any) { toast.add({ title: 'Gagal', description: e?.data?.message, color: 'error' }) }
  finally { isAddingVariant.value = false }
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-2xl">
    <div class="flex items-center gap-3">
      <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" to="/admin/products" />
      <h1 class="text-2xl font-bold">Edit Produk</h1>
    </div>

    <UCard v-if="!product">
      <p class="text-center text-gray-400 py-8">Produk tidak ditemukan.</p>
    </UCard>

    <template v-else-if="product">
      <UCard>
        <template #header><p class="font-semibold">Info Produk</p></template>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="ID Produk">
              <UInput :model-value="productId" disabled class="w-full font-mono opacity-60" />
            </UFormField>
            <UFormField label="Nama Produk" required>
              <UInput v-model="form.name" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Deskripsi">
            <UTextarea v-model="form.description" class="w-full" :rows="2" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="URL Gambar">
              <UInput v-model="form.image" placeholder="https://..." class="w-full" />
            </UFormField>
            <UFormField label="Badge Promo">
              <UInput v-model="form.promoBadge" placeholder="HOT DEAL" class="w-full" />
            </UFormField>
          </div>
          <UCheckbox v-model="form.isActive" label="Produk aktif (tampil di toko)" />
          <UButton :loading="isSaving" label="Simpan Perubahan" icon="i-lucide-save" @click="saveProduct" />
        </div>
      </UCard>

      <UCard>
        <template #header><p class="font-semibold">Varian Saat Ini</p></template>
        <!--
          ↓ GANTI: pakai p (bukan product) — p diketahui TypeScript sebagai ProductAdmin pasti
        -->
        <div v-if="!p.variants?.length" class="text-center py-6 text-gray-400 text-sm">
          Belum ada varian.
        </div>
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <!-- ↓ GANTI: pakai p.variants -->
          <div v-for="v in p.variants" :key="v.id" class="flex items-center justify-between py-3">
            <div>
              <p class="font-medium text-sm">{{ v.duration }}</p>
              <p class="text-xs text-gray-500">
                Rp{{ v.price.toLocaleString('id-ID') }}
                <span v-if="v.promoPrice"> → Promo Rp{{ v.promoPrice.toLocaleString('id-ID') }}</span>
                <span v-if="v.isCustomGmail"> · Gmail Sendiri</span>
              </p>
              <p class="font-mono text-xs text-gray-400">{{ v.id }}</p>
            </div>
            <UButton icon="i-lucide-trash-2" size="xs" color="error" variant="ghost" @click="deleteVariant(v.id)" />
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header><p class="font-semibold">Tambah Varian Baru</p></template>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Durasi" required>
              <UInput v-model="newVariant.duration" placeholder="1 Bulan" class="w-full" />
            </UFormField>
            <UFormField label="ID Varian (opsional)">
              <UInput v-model="newVariant.id" class="w-full font-mono text-xs" placeholder="auto" />
            </UFormField>
            <UFormField label="Harga Normal (Rp)" required>
              <UInput v-model.number="newVariant.price" type="number" placeholder="50000" class="w-full" />
            </UFormField>
            <UFormField label="Harga Promo (Rp)">
              <UInput v-model.number="newVariant.promoPrice" type="number" placeholder="35000" class="w-full" />
            </UFormField>
            <UFormField label="Promo Hari">
              <USelect v-model="newVariant.promoDayOfWeek" :items="dayOptions" class="w-full" />
            </UFormField>
            <UFormField label="Promo Tanggal" description="MM-DD">
              <UInput v-model="newVariant.promoSpecificDate" placeholder="12-25" class="w-full" />
            </UFormField>
          </div>
          <UCheckbox v-model="newVariant.isCustomGmail" label="Butuh Gmail sendiri dari customer" />
          <UButton :loading="isAddingVariant" label="Tambah Varian" icon="i-lucide-plus" @click="addVariant" />
        </div>
      </UCard>
    </template>
  </div>
</template>
