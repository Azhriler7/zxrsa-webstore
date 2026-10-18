<script setup lang="ts">
// Fix: extract ke function, bukan inline di template
async function logout() {
  await $fetch('/api/admin/auth/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-950">
    <aside class="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 space-y-1 flex flex-col">
      <div class="flex items-center gap-2 px-2 py-3 mb-4">
        <UIcon name="i-lucide-shield" class="text-primary-500" />
        <span class="font-bold">Admin Panel</span>
      </div>
      <UButton block variant="ghost" to="/admin"              icon="i-lucide-layout-dashboard" label="Dashboard"  class="justify-start" />
      <UButton block variant="ghost" to="/admin/products"     icon="i-lucide-package"          label="Produk"      class="justify-start" />
      <UButton block variant="ghost" to="/admin/transactions" icon="i-lucide-receipt"          label="Transaksi"   class="justify-start" />
      <div class="flex-1" />
      <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
        <!-- Fix: pakai function logout(), bukan inline $fetch -->
        <UButton
          block variant="ghost" color="error"
          icon="i-lucide-log-out" label="Logout" class="justify-start"
          @click="logout"
        />
      </div>
    </aside>
    <main class="flex-1 overflow-auto"><slot /></main>
  </div>
</template>
