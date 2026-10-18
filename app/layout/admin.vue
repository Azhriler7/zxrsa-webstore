<script setup lang="ts">
const route = useRoute()
const isBurgerExpanded = ref(false)

const navItems = [
  { label: 'Dashboard Admin',          to: '/admin',              icon: 'i-lucide-layout-dashboard', short: 'Dashboard' },
  { label: 'Pesanan & Antrian Gmail',  to: '/admin/transactions', icon: 'i-lucide-inbox',            short: 'Pesanan'   },
  { label: 'Manajemen Stok & Produk',  to: '/admin/products',     icon: 'i-lucide-boxes',            short: 'Stok'      },
]

watch(() => route.path, () => {
  isBurgerExpanded.value = false
})

async function logout() {
  isBurgerExpanded.value = false
  await $fetch('/api/admin/auth/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
    <!-- Reuse UserNavbar in adminMode (No section scroll buttons, includes Burger button) -->
    <UserNavbar
      admin-mode
      @toggle-admin-burger="isBurgerExpanded = !isBurgerExpanded"
    />

    <!-- Top Compact Icon Bar (When Burger is Collapsed: shows only icons + hover tooltip for destination) -->
    <div class="border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-16 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-zinc-200 dark:border-[#00f0ff]/30 bg-zinc-100 dark:bg-[#00f0ff]/10 text-zinc-800 dark:text-[#00f0ff] flex items-center gap-1.5 cursor-pointer"
            @click="isBurgerExpanded = !isBurgerExpanded"
          >
            <UIcon :name="isBurgerExpanded ? 'i-lucide-panel-top-close' : 'i-lucide-menu'" class="size-4" />
            <span class="hidden sm:inline">{{ isBurgerExpanded ? 'Tutup Menu' : 'Menu Console' }}</span>
          </button>

          <div class="flex items-center gap-1.5 pl-2 border-l border-zinc-200 dark:border-white/10">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="group relative p-2 rounded-lg border transition-all flex items-center justify-center"
              :class="
                route.path === item.to
                  ? 'bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 border-transparent shadow-sm'
                  : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-[#00f0ff]'
              "
            >
              <UIcon :name="item.icon" class="size-4" />
              <span class="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-800 text-white dark:text-[#00f0ff] text-[11px] font-mono font-semibold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-white/10 z-50">
                {{ item.label }}
              </span>
            </NuxtLink>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <NuxtLink
            to="/"
            class="group relative p-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 hover:border-[#00f0ff]"
          >
            <UIcon name="i-lucide-store" class="size-4" />
            <span class="pointer-events-none absolute -bottom-9 right-0 whitespace-nowrap px-2.5 py-1 rounded bg-zinc-900 text-white text-[11px] font-mono opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-white/10 z-50">
              Buka Homepage Toko
            </span>
          </NuxtLink>
          <button
            type="button"
            class="group relative p-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 cursor-pointer"
            @click="logout"
          >
            <UIcon name="i-lucide-log-out" class="size-4" />
            <span class="pointer-events-none absolute -bottom-9 right-0 whitespace-nowrap px-2.5 py-1 rounded bg-zinc-900 text-rose-400 text-[11px] font-mono opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-white/10 z-50">
              Keluar (Logout Admin)
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Expanded Top Burger Console Overlay (Blurs the background page when opened!) -->
    <Teleport to="body">
      <div
        v-if="isBurgerExpanded"
        class="fixed inset-0 z-50 bg-zinc-950/65 backdrop-blur-md flex flex-col items-center justify-start pt-20 px-4 animate-fade-up"
        @click.self="isBurgerExpanded = false"
      >
        <div class="w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-[#00f0ff]/40 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
            <div class="flex items-center gap-3">
              <div class="size-9 rounded-lg bg-zinc-900 dark:bg-[#00f0ff] text-white dark:text-zinc-950 font-mono font-black flex items-center justify-center text-sm">
                ZX
              </div>
              <div>
                <p class="font-extrabold text-base text-zinc-900 dark:text-white">ADMIN CONSOLE MENU</p>
                <p class="text-[11px] font-mono text-zinc-400">Pilih halaman manajemen</p>
              </div>
            </div>
            <button
              type="button"
              class="p-2 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-white cursor-pointer"
              @click="isBurgerExpanded = false"
            >
              ✕
            </button>
          </div>

          <nav class="grid grid-cols-1 gap-2.5">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="cyber-card-interactive flex items-center justify-between p-4 rounded-xl border transition-all"
              :class="
                route.path === item.to
                  ? 'bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 border-transparent font-bold'
                  : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-white/10 hover:border-[#00f0ff]'
              "
              @click="isBurgerExpanded = false"
            >
              <div class="flex items-center gap-3.5">
                <UIcon :name="item.icon" class="size-5" />
                <span class="text-sm font-bold">{{ item.label }}</span>
              </div>
              <span class="font-mono text-xs">→</span>
            </NuxtLink>
          </nav>

          <div class="pt-3 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between gap-3">
            <NuxtLink
              to="/"
              class="px-4 py-2.5 rounded-xl text-xs font-mono font-semibold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-[#00f0ff]"
              @click="isBurgerExpanded = false"
            >
              ← Lihat Homepage Toko User
            </NuxtLink>
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500/25 cursor-pointer"
              @click="logout"
            >
              Keluar (Logout Admin)
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Full-Width Admin Main Content -->
    <main class="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
      <slot />
    </main>
  </div>
</template>
