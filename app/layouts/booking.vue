<script setup lang="ts">
import { en, fr, ru } from '@nuxt/ui/locale'

const { getLocale } = useI18n()

// Localize Nuxt UI internals (calendar month/weekday names, aria labels).
const uiLocale = computed(() => ({ en, fr, ru })[getLocale() as 'en' | 'fr' | 'ru'] ?? en)
</script>

<template>
  <UApp :locale="uiLocale">
    <UMain class="min-h-dvh bg-[var(--ui-bg)] text-[var(--ui-text)]">
      <slot />
    </UMain>
  </UApp>
</template>
