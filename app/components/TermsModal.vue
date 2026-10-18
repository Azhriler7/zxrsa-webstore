<script setup lang="ts">
defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'accept': []
}>()

const termsSections = [
  {
    title: '1. Ketentuan Umum Layanan',
    items: [
      'ZXRSA STORE menyediakan layanan produk akun digital premium (Sharing / Private / Custom Gmail) dengan pengiriman otomatis melalui QRIS maupun antrian aktivasi manual.',
      'Pembeli wajib memastikan alamat email penerima nota dan/atau alamat Custom Gmail yang dimasukkan sudah benar dan aktif sebelum menekan tombol pembayaran.',
      'Kesalahan penulisan alamat email oleh pembeli di luar tanggung jawab toko apabila akun telah terkirim ke alamat tersebut.',
    ],
  },
  {
    title: '2. Aturan Penggunaan Akun & Larangan',
    items: [
      'Pembeli wajib mematuhi peraturan spesifik produk yang tertera pada Kartu Invoice setelah pembayaran berhasil.',
      'Untuk akun bertipe Sharing, pembeli dilarang keras mengubah email, password, PIN profil milik pengguna lain, atau menambahkan perangkat melebihi batas kuota.',
      'Pelanggaran terhadap aturan penggunaan produk akan menghanguskan garansi secara otomatis tanpa pengembalian dana.',
    ],
  },
  {
    title: '3. Kebijakan Garansi & Klaim Bantuan',
    items: [
      'Seluruh produk dilengkapi garansi sesuai durasi paket yang dibeli selama pembeli mematuhi peraturan produk pada Kartu Invoice.',
      'Klaim garansi wajib menyertakan bukti Kartu Invoice resmi (Order ID) yang dapat diunduh langsung setelah pembayaran selesai.',
      'Proses penggantian atau perbaikan kendala akun dilakukan maksimal 1x24 jam melalui layanan bantuan resmi toko.',
    ],
  },
  {
    title: '4. Pembayaran QRIS & Pesanan Custom Gmail',
    items: [
      'Pembayaran diproses secara otomatis menggunakan QRIS Dinamis (Mutasiku). Harap selesaikan pembayaran sesuai nominal tepat sebelum batas waktu berakhir.',
      'Untuk varian Ready Stock, kredensial akun beserta peraturan produk langsung tampil di halaman Kartu Invoice segera setelah pembayaran terdeteksi lunas.',
      'Untuk varian Custom Gmail, pesanan akan masuk ke antrian prioritas admin dan diproses maksimal 1x24 jam kerja.',
    ],
  },
]
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      @click.self="emit('update:open', false)"
    >
      <div class="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-cyan-500/25 bg-white dark:bg-[#0d1826] shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
              <UIcon name="i-lucide-scroll-text" class="size-5" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base">Syarat & Ketentuan Pembelian</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Harap baca dengan saksama sebelum melanjutkan transaksi</p>
            </div>
          </div>
          <button
            type="button"
            class="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            @click="emit('update:open', false)"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 dark:text-slate-300">
          <div
            v-for="sec in termsSections"
            :key="sec.title"
            class="rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/70 dark:border-slate-800 p-4 space-y-2.5"
          >
            <h4 class="font-semibold text-slate-900 dark:text-cyan-300">{{ sec.title }}</h4>
            <ul class="space-y-1.5 list-disc list-inside text-xs sm:text-sm leading-relaxed">
              <li v-for="(item, idx) in sec.items" :key="idx">{{ item }}</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/60 dark:bg-[#09121d]">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            @click="emit('update:open', false)"
          >
            Tutup
          </button>
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all"
            @click="emit('accept'); emit('update:open', false)"
          >
            Saya Mengerti & Setuju
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
