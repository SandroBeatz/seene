<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const config = useRuntimeConfig()
const { $ts, $localePath, getLocales } = useI18n()

const localeCodes = computed(() => getLocales().map((locale) => locale.code))
const pathWithoutLocale = computed(() => {
  const pattern = new RegExp(`^/(${localeCodes.value.join('|')})(?=/|$)`)
  return route.path.replace(pattern, '') || '/'
})
const isLandingPage = computed(() => pathWithoutLocale.value === '/')

const homeSectionPath = (hash: string) => `${$localePath('/')}${hash}`

const sectionNavItems = computed<NavigationMenuItem[]>(() => [
  { label: $ts('nav.sections.home'), to: homeSectionPath('#home') },
  { label: $ts('nav.sections.audience'), to: homeSectionPath('#audience') },
  { label: $ts('nav.sections.steps'), to: homeSectionPath('#steps') },
  { label: $ts('nav.sections.features'), to: homeSectionPath('#features') },
  { label: $ts('nav.sections.pricing'), to: homeSectionPath('#pricing') },
  { label: $ts('nav.sections.faq'), to: homeSectionPath('#faq') }
])

const footerNavItems = computed<NavigationMenuItem[]>(() => [
  { label: $ts('nav.about'), to: $localePath('/about') },
  { label: $ts('nav.privacy'), to: $localePath('/privacy') },
  { label: $ts('nav.terms'), to: $localePath('/terms') }
])

const mobileNavItems = computed<NavigationMenuItem[][]>(() => [
  ...(isLandingPage.value ? [sectionNavItems.value] : []),
  footerNavItems.value
])

const scrollY = ref(0)
const isScrolled = computed(() => scrollY.value > 40)
const hasHeaderSurface = computed(() => !isLandingPage.value || isScrolled.value)
const headerClass = computed(() =>
  hasHeaderSurface.value
    ? 'bg-[var(--ui-bg-elevated)]/90 text-[var(--ui-text-highlighted)] backdrop-blur-md !border !border-[var(--ui-border-muted)] shadow-lg shadow-black/5 dark:shadow-black/30'
    : 'bg-transparent text-white shadow-none'
)

if (import.meta.client) {
  const onScroll = () => {
    scrollY.value = window.scrollY
  }

  onMounted(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  })
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
}
</script>

<template>
  <UApp>
    <UHeader mode="drawer" :class="headerClass">
      <template #left>
        <NuxtLink :to="$localePath('/')" :aria-label="$ts('nav.home')">
          <AppLogo class="w-auto h-8 shrink-0" />
        </NuxtLink>
      </template>

      <UNavigationMenu
        v-if="isLandingPage"
        :items="sectionNavItems"
        variant="link"
        class="w-full justify-center"
        :ui="{ link: hasHeaderSurface ? '' : 'text-white/80 hover:text-white' }"
      />

      <template #right>
        <UButton
          :to="config.public.dashboardUrl"
          :aria-label="$ts('nav.cta')"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          :label="$ts('nav.cta')"
          class="hidden sm:inline-flex"
        />
      </template>

      <template #body>
        <UNavigationMenu
          :items="mobileNavItems"
          orientation="vertical"
          variant="link"
          class="w-full"
        />
        <div
          class="mt-6 flex items-center justify-between gap-3 border-t border-[var(--ui-border-muted)] pt-6"
        >
          <div class="flex items-center gap-1.5">
            <LocaleSwitcher />
            <UColorModeButton />
          </div>
          <UButton
            :to="config.public.dashboardUrl"
            :aria-label="$ts('nav.cta')"
            color="primary"
            trailing-icon="i-lucide-arrow-right"
            :label="$ts('nav.cta')"
          />
        </div>
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

      <UNavigationMenu :items="footerNavItems" variant="link" />

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
