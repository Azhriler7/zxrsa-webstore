<script setup lang="ts">
function scrollTo(target: string) {
  const el = document.querySelector(target)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <section id="hero" class="relative overflow-hidden border-b border-zinc-200/80 dark:border-white/10 cyber-grid-bg">
    <div class="pointer-events-none absolute -top-28 left-1/4 size-96 rounded-full bg-cyan-500/5 dark:bg-[#00f0ff]/10 blur-3xl" />
    <div class="pointer-events-none absolute top-12 right-10 size-80 rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-3xl" />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        <!-- Left Column (Fade-in Left) -->
        <div class="lg:col-span-7 space-y-6 animate-fade-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-mono font-semibold bg-zinc-900 text-white dark:bg-[#00f0ff]/10 dark:text-[#00f0ff] border border-zinc-800 dark:border-[#00f0ff]/30">
            <span class="size-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
            <span>SYSTEM ONLINE // INSTANT QRIS DELIVERY</span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-[1.12]">
            Akses Akun Digital.<br />
            <span class="text-cyan-600 dark:text-[#00f0ff]">Presisi, Instan, Bergaransi.</span>
          </h1>

          <p class="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Pilih paket aplikasi premium favoritmu dalam satu halaman. Pembayaran terverifikasi otomatis via QRIS dan Kartu Invoice beserta kredensial langsung diterbitkan detik itu juga.
          </p>

          <div class="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              class="cyber-btn-primary px-6 py-3.5 rounded-lg font-bold text-sm bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950 border border-transparent dark:border-[#00f0ff] dark:shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center gap-2.5 cursor-pointer"
              @click="scrollTo('#katalog')"
            >
              <span>Pilih Produk Sekarang</span>
              <span class="font-mono">→</span>
            </button>
          </div>
        </div>

        <!-- Right Column: Cyber Visual Card (Fade-in Right) -->
        <div class="lg:col-span-5 animate-fade-right">
          <div class="cyber-card-interactive relative rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 p-6 shadow-sm dark:shadow-2xl overflow-hidden">
            <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/60 to-transparent" />
            <div class="relative space-y-5">
              <div class="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 dark:bg-[#00f0ff]/10 dark:text-[#00f0ff] border border-zinc-200 dark:border-[#00f0ff]/30">
                  VERIFIED CATALOG
                </span>
                <span class="text-xs text-zinc-400 font-mono">SYS-V3.5</span>
              </div>

              <div class="h-44 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                <div class="size-14 rounded-lg bg-zinc-900 dark:bg-[#00f0ff]/10 border border-zinc-700 dark:border-[#00f0ff]/40 flex items-center justify-center mb-3 text-[#00f0ff] font-mono font-black text-lg dark:shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  ZX
                </div>
                <p class="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">Katalog Produk Digital Premium</p>
                <p class="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1">Netflix · Spotify · CapCut Pro · Canva · YouTube</p>
              </div>

              <div class="flex items-center justify-between pt-1">
                <div>
                  <p class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">DELIVERY PROTOCOL</p>
                  <p class="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mt-0.5">QRIS · Auto Invoice Card</p>
                </div>
                <span class="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ONLINE 24/7
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
