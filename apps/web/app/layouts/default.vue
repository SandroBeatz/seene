<script setup lang="ts">
import { en, fr, ru } from '@nuxt/ui/locale'

const { getLocale } = useI18n()

// Localize Nuxt UI internals (the menu toggle, drawers).
const uiLocale = computed(() => ({ en, fr, ru })[getLocale() as 'en' | 'fr' | 'ru'] ?? en)
</script>

<template>
  <UApp :locale="uiLocale">
    <SiteHeader />
    <UMain>
      <slot />
    </UMain>
    <SiteFooter />
  </UApp>
</template>
