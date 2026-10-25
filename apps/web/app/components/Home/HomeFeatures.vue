<script setup lang="ts">
/**
 * "Возможности" (#features): four points; the one that is on shows its
 * checklist and its app screen in the phone. Wide screens: the phone on the
 * left, the list of points on the right. Phones and tablets: tabs on top, the
 * chosen point's text, then the phone.
 */
const { $ts } = useI18n()

const items = [
  { key: 'calendar', screen: resolveComponent('HomeAppCalendar') },
  { key: 'clients', screen: resolveComponent('HomeAppClient') },
  { key: 'reminders', screen: resolveComponent('HomeAppRecall') },
  { key: 'money', screen: resolveComponent('HomeAppMoney') }
] as const
const points = ['p1', 'p2', 'p3'] as const

const active = ref(0)
const current = computed(() => items[active.value]!)
const tabs = computed(() => items.map((item) => $ts(`features.${item.key}.tab`)))
</script>

<template>
  <section id="features" class="scroll-mt-(--ui-header-height) border-b border-line">
    <div class="site-container flex flex-col gap-10 py-24 lg:gap-12">
      <div v-reveal class="flex max-w-[760px] flex-col gap-4">
        <div class="site-eyebrow">{{ $ts('features.eyebrow') }}</div>
        <h2 class="site-h2 text-ink">{{ $ts('features.title') }}</h2>
      </div>

      <div class="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-14">
        <!-- Phones and tablets: tabs and the chosen point -->
        <div v-reveal class="flex flex-col gap-6 lg:hidden">
          <HomeShowcaseTabs v-model="active" :labels="tabs" on="white" />
          <div :key="current.key" class="site-rise flex flex-col gap-3">
            <h3 class="m-0 font-display text-[22px] font-semibold tracking-[-0.015em] text-ink">
              {{ $ts(`features.${current.key}.title`) }}
            </h3>
            <p class="m-0 text-[15px] leading-[1.55] text-ink-muted">
              {{ $ts(`features.${current.key}.text`) }}
            </p>
            <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
              <li
                v-for="point in points"
                :key="point"
                class="flex items-start gap-2.5 text-[15px] leading-[1.45] text-ink"
              >
                <UIcon name="i-lucide-check" class="mt-0.5 size-4.5 shrink-0" />
                {{ $ts(`features.${current.key}.${point}`) }}
              </li>
            </ul>
          </div>
        </div>

        <div
          v-reveal
          class="flex min-w-0 items-center justify-center lg:min-h-[700px] lg:flex-[1_1_360px]"
        >
          <div :key="active" class="site-rise drop-shadow-[0_30px_40px_rgba(40,20,15,0.22)]">
            <component :is="current.screen" />
          </div>
        </div>

        <!-- Wide screens: the list of points -->
        <div v-reveal="1" class="hidden min-w-0 flex-[1_1_460px] flex-col gap-2 lg:flex">
          <HomeShowcaseItem
            v-for="(item, i) in items"
            :key="item.key"
            :index="i"
            :title="$ts(`features.${item.key}.title`)"
            :text="$ts(`features.${item.key}.text`)"
            :active="active === i"
            @select="active = i"
          >
            <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
              <li
                v-for="point in points"
                :key="point"
                class="flex items-start gap-2.5 text-[15px] leading-[1.45] text-ink"
              >
                <UIcon name="i-lucide-check" class="mt-0.5 size-4.5 shrink-0" />
                {{ $ts(`features.${item.key}.${point}`) }}
              </li>
            </ul>
          </HomeShowcaseItem>
        </div>
      </div>
    </div>
  </section>
</template>
