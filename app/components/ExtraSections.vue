<script setup lang="ts">
const steps = [
  { num: '01', title: 'Pilih Produk & Paket',   desc: 'Pilih layanan digital dan durasi berlangganan yang sesuai kebutuhanmu.' },
  { num: '02', title: 'Input Email & Setujui S&K', desc: 'Masukkan email aktif dengan format valid dan centang Syarat & Ketentuan.' },
  { num: '03', title: 'Scan QRIS',              desc: 'Bayar menggunakan e-wallet atau m-banking dalam batas waktu 5 menit.' },
  { num: '04', title: 'Unduh Kartu Invoice',    desc: 'Akun beserta aturan pakai spesifik produk langsung tampil di Kartu Invoice.' },
]

const testimonials = [
  {
    email: 'rizky.prat***@gmail.com',
    stars: 5,
    product: 'Netflix Premium UHD (1 Bulan)',
    comment: 'Begitu scan QRIS pakai GoPay, gak sampai 3 detik langsung muncul Kartu Invoice lengkap sama email & password. Desain barunya juga enak banget dilihat.',
    date: '18 Okt 2026',
  },
  {
    email: 'nadia.put***@gmail.com',
    stars: 5,
    product: 'CapCut Pro Creator (1 Bulan)',
    comment: 'Suka banget karena gak perlu daftar akun toko. Cuma masukin email, bayar QRIS, langsung dapet akses Pro. Aturan garansinya juga jelas tertulis di invoice.',
    date: '17 Okt 2026',
  },
  {
    email: 'dimas.akb***@outlook.com',
    stars: 5,
    product: 'Spotify Premium (Custom Gmail)',
    comment: 'Order varian Custom Gmail buat akun pribadi, antriannya cepet banget diproses sama Admin. Notifikasi transaksinya berasa high-tech dan responsif.',
    date: '16 Okt 2026',
  },
  {
    email: 'ayu.lest***@gmail.com',
    stars: 5,
    product: 'Canva Pro (1 Tahun Ready)',
    comment: 'Harga transparan dari awal tanpa biaya admin tambahan yang aneh-aneh. Fitur unduh kartu invoicenya ngebantu banget buat nyimpen bukti garansi.',
    date: '15 Okt 2026',
  },
  {
    email: 'fajar.nug***@gmail.com',
    stars: 5,
    product: 'Netflix Premium Private',
    comment: 'Udah langganan 3 bulan di ZXRSA Store. Kalau ada kendala tinggal klik tombol WhatsApp di kanan bawah, langsung dibantu fast respon.',
    date: '14 Okt 2026',
  },
  {
    email: 'kevin.wij***@gmail.com',
    stars: 5,
    product: 'CapCut Pro Creator (1 Tahun)',
    comment: 'UI tokonya clean dan sharp banget, berasa beli produk digital di platform luar negeri. Proses QRIS-nya sat-set!',
    date: '12 Okt 2026',
  },
]

const activeTestimonialIdx = ref(0)
const slideDirection = ref<'next' | 'prev'>('next')
const dragStartX = ref<number | null>(null)
const dragOffsetX = ref(0)

function nextTestimonial() {
  slideDirection.value = 'next'
  activeTestimonialIdx.value = (activeTestimonialIdx.value + 1) % testimonials.length
}

function prevTestimonial() {
  slideDirection.value = 'prev'
  activeTestimonialIdx.value = (activeTestimonialIdx.value - 1 + testimonials.length) % testimonials.length
}

function onPointerDown(e: PointerEvent) {
  dragStartX.value = e.clientX
  dragOffsetX.value = 0
}

function onPointerMove(e: PointerEvent) {
  if (dragStartX.value === null) return
  dragOffsetX.value = e.clientX - dragStartX.value
}

function onPointerUp() {
  if (dragStartX.value === null) return
  if (dragOffsetX.value < -45) {
    nextTestimonial()
  } else if (dragOffsetX.value > 45) {
    prevTestimonial()
  }
  dragStartX.value = null
  dragOffsetX.value = 0
}

const currentTestimonial = computed(() => testimonials[activeTestimonialIdx.value]!)

const faqs = ref([
  { q: 'Apakah setelah bayar QRIS akun langsung muncul?', a: 'Ya! Untuk paket Ready Stock, sistem otomatis mendeteksi pembayaran setiap 3 detik dan langsung menampilkan Kartu Invoice berisi Email, Password, serta Peraturan Produk.', open: true },
  { q: 'Berapa lama batas waktu pembayaran QRIS?', a: 'Gerbang pembayaran QRIS memiliki batas waktu aktif selama 5 menit. Apabila melewati 5 menit belum dibayar, transaksi otomatis dibatalkan dan Anda akan diarahkan kembali ke halaman utama.', open: false },
  { q: 'Mengapa setiap produk memiliki peraturan berbeda di Invoice Card?', a: 'Setiap aplikasi (seperti Netflix, Spotify, atau CapCut) memiliki batas perangkat dan aturan profil yang berbeda. Peraturan khusus produk dicantumkan di Invoice Card agar akun kamu awet dan garansi tetap berlaku.', open: false },
  { q: 'Bagaimana cara klaim garansi jika terjadi kendala?', a: 'Simpan gambar Kartu Invoice setelah pembayaran berhasil. Jika ada kendala, klik tombol WhatsApp di kanan bawah dengan menyertakan Order ID yang tertera pada invoice.', open: false },
])
</script>

<template>
  <div class="space-y-16 pb-16">
    <!-- 4 Steps Section -->
    <section id="cara-order" class="max-w-6xl mx-auto px-4 sm:px-6 pt-2 animate-fade-up">
      <div class="space-y-1 mb-6">
        <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-600 dark:text-[#00f0ff]">// 02. PROTOKOL PEMESANAN</span>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">Empat Langkah Transaksi Instan</h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="s in steps"
          :key="s.num"
          class="cyber-card-interactive rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/70 p-5 space-y-3"
        >
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#00f0ff]/10 text-zinc-900 dark:text-[#00f0ff] font-mono text-xs font-bold border border-zinc-200 dark:border-[#00f0ff]/30">
              STEP {{ s.num }}
            </span>
            <span class="text-xl font-black text-zinc-200 dark:text-zinc-800 font-mono">{{ s.num }}</span>
          </div>
          <h3 class="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">{{ s.title }}</h3>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{{ s.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Rating & Testimoni Section -->
    <section id="testimoni" class="max-w-6xl mx-auto px-4 sm:px-6 animate-fade-up">
      <div class="text-center space-y-1 mb-6">
        <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-600 dark:text-[#00f0ff]">// 03. RATING &amp; TESTIMONI</span>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">Ulasan Pembeli Terverifikasi</h2>
        <p class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Geser kartu ke kiri/kanan atau gunakan tombol panah — alur ulasan berputar tanpa batas.</p>
      </div>

      <div class="max-w-2xl mx-auto">
        <div
          class="cyber-card-interactive relative rounded-2xl border border-zinc-200 dark:border-[#00f0ff]/35 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-xl select-none overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent" />

          <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-zinc-100 dark:border-white/10">
            <div class="flex items-center gap-3">
              <div class="px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono font-extrabold text-sm flex items-center gap-1.5">
                <span>★ 4.9</span>
                <span class="text-[10px] text-zinc-400">/ 5.0</span>
              </div>
              <div>
                <p class="text-xs font-bold text-zinc-900 dark:text-white">1.240+ Transaksi Sukses</p>
                <p class="text-[10px] font-mono text-zinc-400">INFINITE LOOP REVIEW FEED</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                aria-label="Ulasan Sebelumnya"
                class="cyber-btn-secondary size-9 rounded-lg border border-zinc-200 dark:border-white/15 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-700 dark:text-[#00f0ff] cursor-pointer"
                @pointerdown.stop
                @click="prevTestimonial"
              >
                ←
              </button>
              <span class="font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400 px-1">
                {{ activeTestimonialIdx + 1 }} / {{ testimonials.length }}
              </span>
              <button
                type="button"
                aria-label="Ulasan Selanjutnya"
                class="cyber-btn-secondary size-9 rounded-lg border border-zinc-200 dark:border-white/15 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-700 dark:text-[#00f0ff] cursor-pointer"
                @pointerdown.stop
                @click="nextTestimonial"
              >
                →
              </button>
            </div>
          </div>

          <div
            :key="activeTestimonialIdx"
            class="space-y-5 transition-transform duration-200"
            :class="slideDirection === 'next' ? 'animate-fade-right' : 'animate-fade-left'"
            :style="dragOffsetX ? { transform: `translateX(${dragOffsetX * 0.35}px)` } : undefined"
          >
            <div class="flex items-center justify-between">
              <div class="text-amber-400 text-base sm:text-lg tracking-wider">
                {{ '★'.repeat(currentTestimonial.stars) }}
              </div>
              <span class="text-xs font-mono text-zinc-400">{{ currentTestimonial.date }}</span>
            </div>

            <p class="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium italic">
              "{{ currentTestimonial.comment }}"
            </p>

            <div class="pt-4 border-t border-zinc-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="size-8 rounded-lg bg-zinc-900 dark:bg-[#00f0ff]/15 border border-transparent dark:border-[#00f0ff]/30 text-white dark:text-[#00f0ff] font-mono font-bold text-xs flex items-center justify-center">
                  {{ currentTestimonial.email.slice(0, 2).toUpperCase() }}
                </div>
                <div>
                  <p class="font-mono font-bold text-xs text-zinc-900 dark:text-white">{{ currentTestimonial.email }}</p>
                  <p class="text-[10px] text-emerald-500 font-mono">✓ Pembeli Terverifikasi</p>
                </div>
              </div>
              <span class="text-[11px] font-mono px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-white/5 text-cyan-700 dark:text-[#00f0ff] border border-zinc-200 dark:border-white/10">
                {{ currentTestimonial.product }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-center gap-1.5 pt-5">
            <button
              v-for="(_, i) in testimonials"
              :key="i"
              type="button"
              :aria-label="`Pilih testimoni ${i + 1}`"
              class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
              :class="i === activeTestimonialIdx ? 'w-6 bg-zinc-900 dark:bg-[#00f0ff]' : 'w-1.5 bg-zinc-300 dark:bg-zinc-700'"
              @pointerdown.stop
              @click="activeTestimonialIdx = i"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section with Smooth Animated Open/Close Cards -->
    <section id="faq" class="max-w-6xl mx-auto px-4 sm:px-6 animate-fade-up">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-5 space-y-3">
          <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-600 dark:text-[#00f0ff]">// 04. TANYA JAWAB</span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Pertanyaan Umum
          </h2>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">
            Informasi teknis seputar pembayaran QRIS otomatis, pengiriman akun, dan klaim garansi.
          </p>
        </div>

        <div class="lg:col-span-7 space-y-3">
          <div
            v-for="(item, idx) in faqs"
            :key="idx"
            class="cyber-card-interactive rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/70 overflow-hidden transition-all duration-300"
            :class="item.open ? 'border-zinc-900 dark:border-[#00f0ff]/50 shadow-md' : ''"
          >
            <button
              type="button"
              class="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-zinc-900 dark:text-white cursor-pointer"
              @click="item.open = !item.open"
            >
              <span>{{ item.q }}</span>
              <span
                class="size-6 rounded-md bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-cyan-600 dark:text-[#00f0ff] font-mono font-bold text-sm transition-transform duration-300 shrink-0"
                :class="item.open ? 'rotate-180 bg-zinc-900 text-white dark:bg-[#00f0ff] dark:text-zinc-950' : ''"
              >
                ▾
              </span>
            </button>
            <div
              class="grid transition-all duration-300 ease-out"
              :class="item.open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
            >
              <div class="overflow-hidden">
                <div class="px-5 pb-4 pt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-white/10">
                  {{ item.a }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-zinc-200 dark:border-white/10 pt-8 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
      <div class="flex items-center gap-2.5">
        <div class="size-7 rounded bg-zinc-900 dark:bg-[#00f0ff] text-white dark:text-zinc-950 font-mono font-black flex items-center justify-center">
          ZX
        </div>
        <span class="font-bold text-zinc-900 dark:text-white">ZXRSA STORE</span>
        <span class="font-mono text-[11px]">· MODERN CYBER-MINIMALISM</span>
      </div>
      <p class="font-mono text-[11px]">© {{ new Date().getFullYear() }} ZXRSA STORE · ALL SYSTEMS OPERATIONAL</p>
    </footer>
  </div>
</template>
