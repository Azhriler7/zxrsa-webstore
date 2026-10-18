<script setup lang="ts">
definePageMeta({ layout: false })

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const toast = useToast()

// PENTING: refreshSession wajib dipanggil setelah login sukses agar middleware client mengenali session baru
const { fetch: refreshSession } = useUserSession()

async function login() {
  errorMsg.value = ''
  if (!email.value.trim() || !password.value) {
    errorMsg.value = 'Email dan password wajib diisi.'
    return
  }

  isLoading.value = true
  try {
    await $fetch('/api/admin/auth/login', {
      method: 'POST',
      body: { email: email.value.trim(), password: password.value },
    })
    // Update state useUserSession di client sebelum pindah ke /admin
    await refreshSession()
    toast.add({ title: 'Login berhasil!', color: 'success' })
    await navigateTo('/admin')
  } catch (err: any) {
    errorMsg.value = err?.data?.message || 'Login gagal. Periksa kembali email dan password admin kamu.'
    toast.add({ title: 'Login gagal', description: errorMsg.value, color: 'error' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#071018] flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-3xl border border-slate-200 dark:border-cyan-500/25 bg-white dark:bg-[#0b1623] p-6 sm:p-8 shadow-2xl space-y-6">
      <div class="text-center space-y-2">
        <div class="size-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 font-black flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
          ZX
        </div>
        <h1 class="text-xl font-extrabold text-slate-900 dark:text-white">Admin Panel Login</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400">Masuk untuk mengelola stok, produk, aturan invoice, dan antrian pesanan.</p>
      </div>

      <form class="space-y-4" @submit.prevent="login">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Admin</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="admin@zxrsa.com"
            class="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0f1d2e] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0f1d2e] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <p v-if="errorMsg" class="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
          {{ errorMsg }}
        </p>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 px-4 rounded-xl font-bold text-sm bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <UIcon v-if="isLoading" name="i-lucide-loader-circle" class="size-4 animate-spin" />
          <UIcon v-else name="i-lucide-log-in" class="size-4" />
          <span>Masuk ke Dashboard</span>
        </button>
      </form>

      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
        <NuxtLink to="/" class="text-xs text-slate-400 hover:text-cyan-400">
          ← Kembali ke Halaman Toko
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
