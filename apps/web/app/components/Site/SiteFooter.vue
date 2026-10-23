<script setup lang="ts">
/**
 * Black site footer from the design. Columns link only to pages that exist:
 * the design's "For masters" and "Comparisons" columns wait for their pages.
 */
const { $ts, $localePath, $switchLocalePath, getLocale } = useI18n()

const homePath = computed(() => $localePath('/'))

const columns = computed(() => [
  {
    title: $ts('footer.product'),
    links: [
      { label: $ts('nav.features'), to: `${homePath.value}#features` },
      { label: $ts('nav.pricing'), to: $localePath('/pricing') },
      { label: $ts('footer.founders'), to: `${homePath.value}#join` },
      { label: $ts('nav.download'), to: `${homePath.value}#join` }
    ]
  },
  {
    title: $ts('footer.tools'),
    links: [{ label: $ts('footer.calculator'), to: $localePath('/calculator') }]
  }
])

const legal = computed(() => [
  { label: $ts('footer.privacy'), to: $localePath('/privacy') },
  { label: $ts('footer.terms'), to: $localePath('/terms') },
  { label: $ts('footer.support'), to: 'mailto:help@seene.app' }
])

const languages = ['ru', 'en', 'fr'] as const
</script>

<template>
  <UFooter
    :ui="{
      root: 'bg-ink text-white',
      top: 'py-0',
      container: 'max-w-[1248px] px-6 sm:px-6 lg:px-6 pt-6 pb-10 lg:py-0 lg:pt-6 lg:pb-10',
      left: 'text-[13px] text-[#A6A6AD]',
      right: 'text-[13px]'
    }"
  >
    <template #top>
      <div class="mx-auto flex max-w-[1248px] flex-wrap justify-between gap-12 px-6 pt-18 pb-14">
        <div class="flex flex-[1_1_220px] flex-col gap-4">
          <AppLogo class="h-8 w-auto self-start text-white" />
          <p class="max-w-60 text-[14px] leading-[1.55] text-[#A6A6AD]">
            {{ $ts('footer.tagline') }}
          </p>
        </div>
        <nav
          v-for="column in columns"
          :key="column.title"
          :aria-label="column.title"
          class="flex flex-[0_1_180px] flex-col gap-3 text-[14px]"
        >
          <div class="font-mono text-[12px] tracking-[0.08em] text-[#A6A6AD] uppercase">
            {{ column.title }}
          </div>
          <NuxtLink
            v-for="link in column.links"
            :key="link.label"
            :to="link.to"
            class="text-white hover:text-[#A6A6AD]"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
      <div class="mx-auto max-w-[1248px] px-6">
        <div class="h-px bg-[#2A2A2F]" />
      </div>
    </template>

    <template #left>
      <div class="flex flex-wrap items-center gap-4">
        <span>{{ $ts('footer.copyright') }}</span>
        <nav
          :aria-label="$ts('footer.language')"
          class="flex rounded-full border border-[#2A2A2F] p-0.5 font-mono text-[12px]"
        >
          <NuxtLink
            v-for="code in languages"
            :key="code"
            :to="$switchLocalePath(code)"
            :lang="code"
            :aria-current="getLocale() === code ? 'true' : undefined"
            class="rounded-full px-2.5 py-1.5 uppercase"
            :class="getLocale() === code ? 'bg-white text-ink' : 'text-[#A6A6AD] hover:text-white'"
          >
            {{ code }}
          </NuxtLink>
        </nav>
      </div>
    </template>

    <template #right>
      <div class="flex flex-wrap gap-5">
        <NuxtLink
          v-for="link in legal"
          :key="link.label"
          :to="link.to"
          class="text-[#A6A6AD] hover:text-white"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </template>
  </UFooter>
</template>
