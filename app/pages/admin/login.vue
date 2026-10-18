<script setup lang="ts">
definePageMeta({ layout: false })
const email = ref(''); const password = ref(''); const isLoading = ref(false)
const toast = useToast()

// TAMBAHKAN INI: Ambil fungsi fetch dari useUserSession untuk update state login di browser
const { fetch: refreshSession } = useUserSession()

async function login() {
  isLoading.value = true
  try {
    await $fetch('/api/admin/auth/login',{ method:'POST', body:{ email:email.value, password:password.value } })
    await navigateTo('/admin')
  }
  catch { toast.add({ title:'Login gagal', description:'Periksa email dan password.', color:'error' }) }
  finally { isLoading.value = false }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="flex items-center gap-2 justify-center py-2">
          <UIcon name="i-lucide-shield" class="text-primary-500 size-6" />
          <span class="font-bold text-lg">Admin ZXRSA STORE</span>
        </div>
      </template>
      <div class="space-y-4">
        <UFormField label="Email"><UInput v-model="email" type="email" placeholder="admin@digistore.com" class="w-full" /></UFormField>
        <UFormField label="Password"><UInput v-model="password" type="password" placeholder="••••••••" class="w-full" /></UFormField>
        <UButton block :loading="isLoading" label="Masuk" icon="i-lucide-log-in" @click="login" />
      </div>
    </UCard>
  </div>
</template>
