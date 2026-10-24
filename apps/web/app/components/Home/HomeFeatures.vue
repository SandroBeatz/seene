<script setup lang="ts">
/**
 * "Возможности" (#features): four points; the one that is on shows its
 * checklist and its app screen in the phone next to it. On phones the list
 * comes first and the phone under it (`flex-wrap-reverse`, as in the design).
 */
const items = [
  { key: 'calendar', screen: resolveComponent('HomeAppCalendar') },
  { key: 'clients', screen: resolveComponent('HomeAppClient') },
  { key: 'reminders', screen: resolveComponent('HomeAppRecall') },
  { key: 'money', screen: resolveComponent('HomeAppMoney') }
] as const
const points = ['p1', 'p2', 'p3'] as const

const active = ref(0)
</script>

<template>
  <section id="features" class="scroll-mt-(--ui-header-height) border-b border-line">
    <div class="site-container flex flex-col gap-12 py-24">
      <div v-reveal class="flex max-w-[760px] flex-col gap-4">
        <div class="site-eyebrow">{{ $ts('features.eyebrow') }}</div>
        <h2 class="site-h2 text-ink">{{ $ts('features.title') }}</h2>
      </div>

      <div class="flex flex-wrap-reverse items-center gap-14">
        <div
          v-reveal
          class="flex min-h-[700px] min-w-0 flex-[1_1_360px] items-center justify-center"
        >
          <div :key="active" class="site-rise drop-shadow-[0_30px_40px_rgba(40,20,15,0.22)]">
            <component :is="items[active]!.screen" />
          </div>
        </div>

        <div v-reveal="1" class="flex min-w-0 flex-[1_1_460px] flex-col gap-2">
          <HomeShowcaseItem
            v-for="(item, i) in items"
            :key="item.key"
            :index="i"
            numbering="zero"
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
