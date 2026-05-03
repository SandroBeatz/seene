<script setup lang="ts">
const { $ts, $localePath } = useI18n()

const pricingSection = ref<HTMLElement>()
const { isVisible: pricingVisible } = useScrollReveal(pricingSection)

const freeFeatures = computed(() => [
  $ts('pricing.free.feature1'),
  $ts('pricing.free.feature2'),
  $ts('pricing.free.feature3'),
  $ts('pricing.free.feature4')
])

const proFeatures = computed(() => [
  $ts('pricing.pro.feature1'),
  $ts('pricing.pro.feature2'),
  $ts('pricing.pro.feature3'),
  $ts('pricing.pro.feature4'),
  $ts('pricing.pro.feature5'),
  $ts('pricing.pro.feature6')
])
</script>

<template>
  <section id="pricing" ref="pricingSection" class="py-20 px-4 bg-[var(--section-bg-warm)]">
    <div class="max-w-2xl mx-auto">
      <h2
        class="text-2xl font-bold text-center text-[var(--color-heading)] mb-12 transition-all duration-700"
        :class="pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        {{ $ts('pricing.title') }}
      </h2>
      <div class="flex flex-col sm:flex-row gap-6">
        <div
          class="flex-1 rounded-3xl bg-[var(--ui-bg-elevated)] shadow-md shadow-black/5 ring-1 ring-[var(--ui-border-muted)] transition-all duration-700 dark:shadow-black/30"
          :class="pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          style="padding: 32px"
        >
          <p class="text-base font-semibold text-[var(--ui-text-muted)] mb-1">
            {{ $ts('pricing.free.name') }}
          </p>
          <p class="text-3xl font-bold text-[var(--ui-text-highlighted)] mb-6">
            {{ $ts('pricing.free.price') }}
          </p>
          <ul class="space-y-3 mb-8">
            <li v-for="(feat, i) in freeFeatures" :key="i" class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span class="text-sm text-[var(--ui-text-highlighted)]">{{ feat }}</span>
            </li>
          </ul>
          <UButton
            :to="$localePath('/signup')"
            :label="$ts('pricing.free.cta')"
            color="neutral"
            variant="outline"
            block
            class="rounded-3xl"
          />
        </div>
        <div
          class="flex-1 rounded-3xl bg-[var(--ui-bg-elevated)] shadow-xl shadow-black/10 relative ring-1 ring-amber-500/40 transition-all duration-700 dark:shadow-black/40"
          :class="pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          style="padding: 32px; transition-delay: 150ms"
        >
          <div
            class="absolute top-4 right-4 bg-amber-500 text-white rounded-full text-xs font-medium px-3 py-1"
          >
            {{ $ts('pricing.pro.badge') }}
          </div>
          <p class="text-base font-semibold text-[var(--ui-text-muted)] mb-1">
            {{ $ts('pricing.pro.name') }}
          </p>
          <div class="flex items-baseline gap-1 mb-6">
            <span class="text-3xl font-bold text-[var(--ui-text-highlighted)]">{{
              $ts('pricing.pro.price')
            }}</span>
            <span class="text-sm text-[var(--ui-text-muted)]">{{ $ts('pricing.pro.period') }}</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li v-for="(feat, i) in proFeatures" :key="i" class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span class="text-sm text-[var(--ui-text-highlighted)]">{{ feat }}</span>
            </li>
          </ul>
          <UButton
            :to="$localePath('/signup')"
            :label="$ts('pricing.pro.cta')"
            color="primary"
            block
            class="rounded-3xl"
          />
        </div>
      </div>
      <p
        class="text-center text-sm text-[var(--ui-text-muted)] mt-6 flex items-center justify-center gap-2"
      >
        <UIcon name="i-lucide-lock" class="w-4 h-4" />
        {{ $ts('pricing.notice') }}
      </p>
    </div>
  </section>
</template>
