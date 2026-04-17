import type { ModuleOptions } from 'nuxt-i18n-micro'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    i18n?: Partial<ModuleOptions>
  }
  interface NuxtOptions {
    i18n?: ModuleOptions
  }
}

export {}
