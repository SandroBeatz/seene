<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

const config = useRuntimeConfig()
const { $ts } = useI18n()

const links = ref<ButtonProps[]>([
  {
    label: $ts('finalCta.button'),
    color: 'neutral',
    to: config.public.dashboardUrl,
    size: 'xl',
    ui: { base: 'bg-white! text-neutral-900! hover:bg-white/90!' }
  }
])
</script>

<template>
  <UPageSection :ui="{ container: 'py-10!' }">
    <UPageCTA
      :title="$ts('finalCta.title')"
      :description="$ts('finalCta.microtext')"
      :links="links"
      :ui="{ root: 'bg-primary', title: 'text-neutral-50', description: 'text-neutral-300' }"
    />
  </UPageSection>
</template>
