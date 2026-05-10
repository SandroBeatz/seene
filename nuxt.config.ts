// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', 'nuxt-i18n-micro', '@pinia/nuxt', '@pinia/colada-nuxt'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
    fallback: 'light',
    storageKey: 'seene-color-mode',
    classSuffix: ''
  },

  ui: {
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error']
    }
  },

  runtimeConfig: {
    supabaseUrl: '',
    supabasePublishableKey: '',
    supabaseServiceRoleKey: '',
    phoneVerificationTokenSecret: '',
    public: {
      dashboardUrl: import.meta.env.NUXT_PUBLIC_DASHBOARD_URL || 'https://master-seene.vercel.app'
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    prerender: {
      ignore: [/^\/(fr|ru)\/(en|fr|ru)(\/|$)/]
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', dir: 'ltr' },
      { code: 'fr', iso: 'fr-FR', dir: 'ltr' },
      { code: 'ru', iso: 'ru-RU', dir: 'ltr' }
    ],
    defaultLocale: 'en',
    translationDir: 'locales',
    meta: true
  }
})
