<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { $t, $localePath } = useI18n()

const navItems = computed<NavigationMenuItem[]>(() => [
  { label: $t('nav.about'), to: $localePath('/about') },
  { label: $t('nav.privacy'), to: $localePath('/privacy') },
  { label: $t('nav.terms'), to: $localePath('/terms') }
])
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink :to="$localePath('/')">
          <AppLogo class="w-auto h-8 shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <UButton
          :to="$localePath('/signup')"
          :aria-label="$t('nav.cta')"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          :label="$t('nav.cta')"
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
