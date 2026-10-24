<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

/**
 * Site header from the "Главная" artboard: logo, Features · Master page · Pricing ·
 * Tools, and "Download", which leads to the founders form until the app is in the
 * stores. Sticky, translucent with a blur (animation spec: the main action stays at
 * hand). "Blog" from the design has no page yet and is left out.
 */
const route = useRoute()
const { $ts, $localePath } = useI18n()

const homePath = computed(() => $localePath('/'))
const isActive = (path: string) => route.path === $localePath(path)

const items = computed<NavigationMenuItem[]>(() => [
  { label: $ts('nav.features'), to: `${homePath.value}#features`, active: false },
  { label: $ts('nav.booking'), to: `${homePath.value}#booking`, active: false },
  { label: $ts('nav.pricing'), to: $localePath('/pricing'), active: isActive('/pricing') },
  { label: $ts('nav.tools'), to: $localePath('/calculator'), active: isActive('/calculator') }
])
</script>

<template>
  <UHeader
    mode="drawer"
    :ui="{
      root: 'border-line',
      container: 'max-w-[1248px] px-6 sm:px-6 lg:px-6',
      center: 'lg:flex',
      toggle: 'text-ink'
    }"
  >
    <template #left>
      <NuxtLink :to="homePath" :aria-label="$ts('nav.homeAria')" class="flex items-center">
        <AppLogo class="h-7 w-auto text-ink" />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
      :aria-label="$ts('nav.main')"
      :ui="{
        list: 'gap-7',
        link: 'px-0 py-2 text-[14px] font-medium text-ink hover:text-ink-muted before:hidden data-active:underline data-active:underline-offset-[6px]',
        linkLabel: 'overflow-visible'
      }"
    />

    <template #right>
      <UButton
        :ui="{ label: 'leading-[normal]' }"
        :to="`${homePath}#join`"
        :label="$ts('nav.download')"
        color="primary"
        class="leading-[normal] rounded-full px-4.5 py-2.5 text-[14px] font-semibold active:scale-[0.98] hover:bg-ink/85"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        variant="link"
        :ui="{ link: 'py-3 text-[16px] font-medium text-ink before:hidden' }"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
</template>
