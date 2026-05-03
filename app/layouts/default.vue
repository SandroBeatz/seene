<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { $ts, $localePath } = useI18n()

const navItems = computed<NavigationMenuItem[]>(() => [
  { label: $ts('nav.about'), to: $localePath('/about') },
  { label: $ts('nav.privacy'), to: $localePath('/privacy') },
  { label: $ts('nav.terms'), to: $localePath('/terms') }
])

const scrollY = ref(0)
const isScrolled = computed(() => scrollY.value > 40)

if (import.meta.client) {
  const onScroll = () => { scrollY.value = window.scrollY }
  window.addEventListener('scroll', onScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
}
</script>

<template>
  <UApp>
    <UHeader :class="isScrolled ? 'backdrop-blur-md !border-b !border-warm-200/50' : ''">
      <template #left>
        <NuxtLink :to="$localePath('/')">
          <AppLogo class="w-auto h-8 shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <UButton
          :to="$localePath('/signup')"
          :aria-label="$ts('nav.cta')"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          :label="$ts('nav.cta')"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <NuxtLink :to="$localePath('/')">
          <AppLogo class="w-auto h-7 shrink-0" />
        </NuxtLink>
      </template>

      <UNavigationMenu :items="navItems" variant="link" />

      <template #right>
        <LocaleSwitcher />
        <UColorModeButton />
        <UButton
          to="https://instagram.com"
          target="_blank"
          icon="i-simple-icons-instagram"
          aria-label="Instagram"
          color="neutral"
          variant="ghost"
        />
        <UButton
          to="https://tiktok.com"
          target="_blank"
          icon="i-simple-icons-tiktok"
          aria-label="TikTok"
          color="neutral"
          variant="ghost"
        />
        <UButton
          to="mailto:help@seene.app"
          icon="i-lucide-mail"
          aria-label="help@seene.app"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>

<style scoped></style>
