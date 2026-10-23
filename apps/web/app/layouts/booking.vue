<script setup lang="ts">
import { en, fr, ru } from '@nuxt/ui/locale'

const { getLocale } = useI18n()
const { cssVars } = useMasterTheme()

// Localize Nuxt UI internals (calendar month/weekday names, aria labels).
const uiLocale = computed(() => ({ en, fr, ru })[getLocale() as 'en' | 'fr' | 'ru'] ?? en)
</script>

<template>
  <UApp :locale="uiLocale">
    <div :style="cssVars">
      <UMain class="min-h-dvh bg-default text-default">
        <slot />
      </UMain>
    </div>
  </UApp>
</template>
