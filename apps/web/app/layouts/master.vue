<script setup lang="ts">
import { en, fr, ru } from '@nuxt/ui/locale'

const { getLocale } = useI18n()

useMasterThemeRoot()

// Localize Nuxt UI internals (aria labels of modals, carousel, etc.).
const uiLocale = computed(() => ({ en, fr, ru })[getLocale() as 'en' | 'fr' | 'ru'] ?? en)
</script>

<template>
  <UApp :locale="uiLocale">
    <!-- The fade softens the switch from the default theme to the master's. -->
    <UMain
      class="min-h-dvh bg-default text-default transition-colors duration-300 motion-reduce:transition-none"
    >
      <slot />
    </UMain>
  </UApp>
</template>
