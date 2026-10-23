<script setup lang="ts">
const config = useRuntimeConfig()
const { $ts, $localePath } = useI18n()
</script>

<template>
  <UPageSection id="home" :ui="{ container: 'py-10!' }">
    <div class="flex flex-col">
      <div class="flex justify-center">
        <img src="assets/img/hero-img.png" :alt="$ts('hero.imageAlt')" />
      </div>
      <div class="text-center max-w-4xl mx-auto pt-6">
        <UBadge variant="soft" class="mb-4">{{ $ts('hero.badge') }}</UBadge>
        <h1 class="text-5xl font-bold leading-[1.15] tracking-tight mb-5">
          {{ $ts('hero.title') }}
        </h1>

        <p class="mb-8">
          {{ $ts('hero.description') }}
        </p>

        <div class="flex flex-wrap justify-center gap-3 mb-4">
          <UButton
            :to="config.public.dashboardUrl"
            :label="$ts('hero.cta')"
            color="primary"
            size="xl"
          />
          <UButton
            :to="$localePath('/for/nail-masters')"
            :label="$ts('hero.ctaSecondary')"
            variant="outline"
            size="xl"
          />
        </div>
      </div>
    </div>
  </UPageSection>
</template>

<style scoped></style>
