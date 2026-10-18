export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxthub/core', 'nuxt-auth-utils', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],

  hub: {
    db: 'sqlite',
  },

  runtimeConfig: {
    mutasikuApiKey:          '',   // NUXT_MUTASIKU_API_KEY
    mutasikuWalletAccountId: '',   // NUXT_MUTASIKU_WALLET_ACCOUNT_ID
    mutasikuPaymentType:     'QRIS-DYNAMIC',
    mutasikuWebhookSecret:   '',   // NUXT_MUTASIKU_WEBHOOK_SECRET
    setupKey:                '',   // NUXT_SETUP_KEY
  },

  nitro: {
    cloudflare: {
      wrangler: {
        compatibility_flags: ['nodejs_compat'],
      },
    },
    experimental: { tasks: true },
  },
})