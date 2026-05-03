<script setup lang="ts">
const { $ts } = useI18n()

const personalSection = ref<HTMLElement>()
const { isVisible: personalVisible } = useScrollReveal(personalSection)

const personalFeatures = computed(() => [
  $ts('personalPage.features.avatar'),
  $ts('personalPage.features.services'),
  $ts('personalPage.features.booking'),
  $ts('personalPage.features.contacts')
])

const mockupServices = computed(() => [
  {
    name: $ts('personalPage.mockup.services.manicure.name'),
    price: $ts('personalPage.mockup.services.manicure.price'),
    duration: $ts('personalPage.mockup.services.manicure.duration')
  },
  {
    name: $ts('personalPage.mockup.services.gel.name'),
    price: $ts('personalPage.mockup.services.gel.price'),
    duration: $ts('personalPage.mockup.services.gel.duration')
  },
  {
    name: $ts('personalPage.mockup.services.pedicure.name'),
    price: $ts('personalPage.mockup.services.pedicure.price'),
    duration: $ts('personalPage.mockup.services.pedicure.duration')
  }
])
</script>

<template>
  <section id="profile" ref="personalSection" class="py-20 px-4 bg-[var(--section-bg-warm)]">
    <div class="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16">
      <div
        class="flex-1 transition-all duration-700"
        :class="personalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <h2 class="text-2xl font-bold text-[var(--color-heading)] mb-4">
          {{ $ts('personalPage.title') }}
        </h2>
        <p class="text-base text-[var(--ui-text-muted)] leading-relaxed mb-6">
          {{ $ts('personalPage.description') }}
        </p>
        <ul class="space-y-4">
          <li v-for="(feat, i) in personalFeatures" :key="i" class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span class="text-sm text-[var(--ui-text-highlighted)]">{{ feat }}</span>
          </li>
        </ul>
      </div>
      <div
        class="flex-1 flex justify-center transition-all duration-700"
        :class="personalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
        style="transition-delay: 150ms"
      >
        <div class="relative mx-auto" style="width: 280px">
          <div
            class="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--ui-bg-elevated)] text-[var(--ui-text-highlighted)] rounded-2xl shadow-lg shadow-black/10 ring-1 ring-[var(--ui-border-muted)] px-4 py-2 text-sm font-medium whitespace-nowrap z-10 dark:shadow-black/40"
          >
            seene.app/alina_nails
          </div>
          <div class="bg-neutral-950 rounded-[2.5rem] p-3 shadow-2xl">
            <div
              class="bg-[var(--ui-bg-elevated)] rounded-[2rem] overflow-hidden flex flex-col items-center pt-8 pb-6 px-4"
              style="height: 560px"
            >
              <div class="w-20 h-20 rounded-full bg-amber-100 mb-3 flex-shrink-0" />
              <p class="font-semibold text-base text-[var(--ui-text-highlighted)] mb-1">
                {{ $ts('personalPage.mockup.name') }}
              </p>
              <p class="text-xs text-[var(--ui-text-muted)] mb-5">
                {{ $ts('personalPage.mockup.role') }}
              </p>
              <div class="w-full space-y-2 mb-5">
                <div
                  v-for="svc in mockupServices"
                  :key="svc.name"
                  class="flex justify-between items-center rounded-2xl bg-[var(--ui-bg-muted)] px-3 py-2"
                >
                  <span class="text-xs font-medium text-[var(--ui-text-highlighted)]">
                    {{ svc.name }}
                  </span>
                  <div class="text-right">
                    <p class="text-xs font-semibold text-amber-500">{{ svc.price }}</p>
                    <p class="text-xs text-[var(--ui-text-dimmed)]">{{ svc.duration }}</p>
                  </div>
                </div>
              </div>
              <UButton
                color="primary"
                size="sm"
                class="w-full rounded-2xl"
                :label="$ts('personalPage.mockupCta')"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
