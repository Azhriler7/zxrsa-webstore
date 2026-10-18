<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger' | 'warning'
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
        @click.self="emit('update:open', false)"
      >
        <div class="w-full max-w-md rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-[#0d1826] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-start gap-4">
            <div
              class="size-11 rounded-xl flex items-center justify-center shrink-0"
              :class="{
                'bg-cyan-500/15 text-cyan-500': !variant || variant === 'primary',
                'bg-rose-500/15 text-rose-500': variant === 'danger',
                'bg-amber-500/15 text-amber-500': variant === 'warning',
              }"
            >
              <UIcon
                :name="variant === 'danger' ? 'i-lucide-trash-2' : variant === 'warning' ? 'i-lucide-triangle-alert' : 'i-lucide-shield-check'"
                class="size-6"
              />
            </div>
            <div class="space-y-1.5">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ title }}</h3>
              <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {{ description }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              :disabled="loading"
              class="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              @click="emit('update:open', false)"
            >
              {{ cancelLabel || 'Batal' }}
            </button>
            <button
              type="button"
              :disabled="loading"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
              :class="{
                'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20': !variant || variant === 'primary',
                'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20': variant === 'danger',
                'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20': variant === 'warning',
              }"
              @click="emit('confirm')"
            >
              <UIcon v-if="loading" name="i-lucide-loader-circle" class="size-4 animate-spin" />
              <span>{{ confirmLabel || 'Ya, Lanjutkan' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
