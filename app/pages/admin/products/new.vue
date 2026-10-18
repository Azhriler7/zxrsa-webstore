<script setup lang="ts">
// Fix: pakai array untuk middleware
definePageMeta({
  middleware: ['admin'],
  layout: 'admin',
})

const toast    = useToast()
const isSaving = ref(false)

const form = reactive({
  id:          '',
  name:        '',
  description: '',
  image:       '',
  promoBadge:  '',
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

const variants = ref<VariantForm[]>([])

const dayOptions = [
  { label: '—',       value: ''          },
  { label: 'Senin',   value: 'Monday'    },
  { label: 'Selasa',  value: 'Tuesday'   },
  { label: 'Rabu',    value: 'Wednesday' },
  { label: 'Kamis',   value: 'Thursday'  },
  { label: 'Jumat',   value: 'Friday'    },
  { label: 'Sabtu',   value: 'Saturday'  },
  { label: 'Minggu',  value: 'Sunday'    },
]

function addVariant() {
  variants.value.push({
    id:                `${form.id || 'new'}-${Date.now()}`,
    duration:          '',
    price:             0,
    promoPrice:        '',
    promoDayOfWeek:    '',
    promoSpecificDate: '',
    isCustomGmail:     false,
  })
}

function removeVariant(i: number) { variants.value.splice(i, 1) }

async function save() {
  if (!form.id || !form.name) {
    toast.add({ title: 'ID dan nama produk wajib diisi.', color: 'error' }); return
  }
  isSaving.value = true
  try {
    await $fetch('/api/admin/products', {
      method: 'POST',
      body: {
        id:          form.id,
        name:        form.name,
        description: form.description || undefined,
        image:       form.image       || undefined,
        promoBadge:  form.promoBadge  || undefined,
      },
    })
    for (const v of variants.value) {
      if (!v.duration || !v.price) continue
      await $fetch('/api/admin/variants', {
        method: 'POST',
        body: {
          id:                v.id,
          productId:         form.id,
          duration:          v.duration,
          price:             v.price,
          promoPrice:        v.promoPrice !== '' ? v.promoPrice : undefined,
          promoDayOfWeek:    v.promoDayOfWeek    || undefined,
          promoSpecificDate: v.promoSpecificDate || undefined,
          isCustomGmail:     v.isCustomGmail,
        },
      })
    }
    toast.add({ title: 'Produk berhasil disimpan!', color: 'success' })
    navigateTo('/admin/products')
  }
  catch (e: any) { toast.add({ title: 'Gagal', description: e?.data?.message, color: 'error' }) }
  finally { isSaving.value = false }
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-2xl">
    <div class="flex items-center gap-3">
      <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" to="/admin/products" />
      <h1 class="text-2xl font-bold">Tambah Produk</h1>
    </div>

    <UCard>
      <template #header><p class="font-semibold">Info Produk</p></template>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="ID Produk" description="Slug unik, contoh: netflix" required>
            <UInput v-model="form.id" placeholder="netflix" class="w-full font-mono" />
          </UFormField>
          <UFormField label="Nama Produk" required>
            <UInput v-model="form.name" placeholder="Netflix Premium" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Deskripsi">
          <UTextarea v-model="form.description" placeholder="Deskripsi singkat..." class="w-full" :rows="2" />
        </UFormField>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="URL Gambar">
            <UInput v-model="form.image" placeholder="https://..." class="w-full" />
          </UFormField>
          <UFormField label="Badge Promo">
            <UInput v-model="form.promoBadge" placeholder="HOT DEAL" class="w-full" />
          </UFormField>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-semibold">Varian</p>
          <UButton icon="i-lucide-plus" size="sm" label="Tambah Varian" @click="addVariant" />
        </div>
      </template>

      <div v-if="variants.length === 0" class="text-center py-8 text-gray-400">
        <UIcon name="i-lucide-package" class="size-8 mx-auto mb-2" />
        <p class="text-sm">Belum ada varian.</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="(v, i) in variants" :key="i" class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="font-medium text-sm">Varian {{ i + 1 }}</p>
            <UButton icon="i-lucide-trash-2" size="xs" color="error" variant="ghost" @click="removeVariant(i)" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Durasi" required>
              <UInput v-model="v.duration" placeholder="1 Bulan" class="w-full" />
            </UFormField>
            <UFormField label="ID Varian">
              <UInput v-model="v.id" class="w-full font-mono text-xs" />
            </UFormField>
            <UFormField label="Harga Normal (Rp)" required>
              <UInput v-model.number="v.price" type="number" placeholder="50000" class="w-full" />
            </UFormField>
            <UFormField label="Harga Promo (Rp)">
              <UInput v-model.number="v.promoPrice" type="number" placeholder="35000" class="w-full" />
            </UFormField>
            <UFormField label="Promo Hari">
              <USelect v-model="v.promoDayOfWeek" :items="dayOptions" class="w-full" />
            </UFormField>
            <UFormField label="Promo Tanggal" description="MM-DD, contoh: 12-25">
              <UInput v-model="v.promoSpecificDate" placeholder="12-25" class="w-full" />
            </UFormField>
          </div>
          <UCheckbox v-model="v.isCustomGmail" label="Butuh Gmail sendiri dari customer" />
        </div>
      </div>
    </UCard>

    <div class="flex gap-3">
      <UButton :loading="isSaving" label="Simpan Produk" icon="i-lucide-save" @click="save" />
      <UButton to="/admin/products" color="neutral" variant="outline" label="Batal" />
    </div>
  </div>
</template>