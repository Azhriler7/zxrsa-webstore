<script setup lang="ts">
const props = defineProps<{
  adminMode?: boolean
}>()

const colorMode = useColorMode()
const mobileMenuOpen = ref(false)

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (val: boolean) => {
    colorMode.preference = val ? 'dark' : 'light'
  },
})

const navItems = [
  { label: 'Home',               target: '#hero'       },
  { label: 'Katalog',            target: '#katalog'    },
  { label: 'Cara Order',         target: '#cara-order' },
  { label: 'Rating & Testimoni', target: '#testimoni'  },
  { label: 'FAQ',                target: '#faq'        },
]

const emit = defineEmits<{
  'go-home': []
  'toggle-admin-burger': []
}>()

function scrollToSection(target: string) {
  mobileMenuOpen.value = false
  emit('go-home')
  nextTick(() => {
    if (target === '#hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.querySelector(target)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}
</script>

<template>
  <header class="sticky top-0 z-40 backdrop-blur-xl bg-zinc-50/90 dark:bg-zinc-950/90 border-b border-zinc-200/80 dark:border-white/10 transition-colors">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <!-- Admin Burger Button (Only when adminMode is true) -->
        <button
          v-if="props.adminMode"
          type="button"
          aria-label="Toggle Admin Console"
          class="cyber-btn-secondary p-2.5 rounded-lg border border-zinc-200 dark:border-[#00f0ff]/40 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-[#00f0ff] cursor-pointer"
          title="Buka / Kecilkan Menu Admin Console"
          @click="emit('toggle-admin-burger')"
        >
          <UIcon name="i-lucide-menu" class="size-5" />
        </button>

        <!-- Brand Logo -->
        <button
          type="button"
          class="flex items-center gap-3 text-left group cursor-pointer"
          @click="props.adminMode ? navigateTo('/admin') : scrollToSection('#hero')"
        >
          <div class="size-9 rounded-lg bg-zinc-900 border border-zinc-300 dark:border-[#00f0ff]/40 flex items-center justify-center text-white dark:text-[#00f0ff] font-mono font-black text-sm dark:shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            ZX
          </div>
          <div>
            <span class="font-extrabold tracking-tight text-base sm:text-lg text-zinc-900 dark:text-white block leading-none">
              ZXRSA <span class="text-cyan-600 dark:text-[#00f0ff]">STORE</span>
            </span>
            <span class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 tracking-widest uppercase block mt-0.5">
              {{ props.adminMode ? 'ADMIN CONSOLE PORTAL' : 'CYBER DIGITAL HUB' }}
            </span>
          </div>
        </button>
      </div>

      <!-- Desktop Smooth Scroll Links (Hidden on Admin Page) -->
      <nav v-if="!props.adminMode" class="hidden md:flex items-center gap-1">
        <button
          v-for="item in navItems"
          :key="item.target"
          type="button"
          class="px-3.5 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-[#00f0ff] hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
          @click="scrollToSection(item.target)"
        >
          {{ item.label }}
        </button>
      </nav>

      <!-- Right Controls: Theme Toggle & Mobile Hamburger -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          :aria-label="isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'"
          class="cyber-btn-secondary p-2.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-[#00f0ff] cursor-pointer"
          @click="isDark = !isDark"
        >
          <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
        </button>

        <!-- Mobile Hamburger (Only on User Storefront) -->
        <button
          v-if="!props.adminMode"
          type="button"
          class="md:hidden p-2.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <UIcon :name="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="size-5" />
        </button>
      </div>
    </div>

    <!-- Mobile Menu Drawer (User Storefront) -->
    <div
      v-if="!props.adminMode && mobileMenuOpen"
      class="md:hidden border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 space-y-1"
    >
      <button
        v-for="item in navItems"
        :key="item.target"
        type="button"
        class="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/5"
        @click="scrollToSection(item.target)"
      >
        {{ item.label }}
      </button>
    </div>
  </header>
</template>
