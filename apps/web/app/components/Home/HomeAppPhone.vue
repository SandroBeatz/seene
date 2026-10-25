<script setup lang="ts">
/**
 * A phone with an app screen drawn in HTML (the "App*" artboards, 320 × 660).
 * The screen is a picture for people: its text is in `label`, the content is
 * hidden from screen readers. `tab` adds the app's bottom bar with that tab on.
 */
defineProps<{
  label: string
  tab?: 'today' | 'calendar' | 'clients' | 'money'
}>()

// The bar's icons, as drawn in the artboards (24 × 24, stroke 2)
const tabs = [
  { key: 'today', paths: ['M12 2v2M12 20v2M2 12h2M20 12h2'], circle: true },
  { key: 'calendar', paths: ['M3 10h18M8 3v4M16 3v4'], rect: { y: 5, h: 16 } },
  {
    key: 'clients',
    paths: ['M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5 5 0 0 1 3.5 6'],
    head: true
  },
  { key: 'money', paths: ['M3 10h18M7 15h3'], rect: { y: 6, h: 13 } }
] as const
</script>

<template>
  <div
    role="img"
    :aria-label="label"
    class="h-[660px] w-[320px] shrink-0 rounded-[52px] bg-ink p-2.5"
  >
    <div
      class="relative flex size-full flex-col overflow-hidden rounded-[42px] bg-white text-ink"
      aria-hidden="true"
    >
      <slot />

      <div
        v-if="tab"
        class="mt-auto flex justify-around border-t border-[#EFEFEC] px-2 pt-2.5 pb-4.5 text-[10px] text-ink-muted"
      >
        <div
          v-for="item in tabs"
          :key="item.key"
          class="flex flex-col items-center gap-[3px]"
          :class="item.key === tab ? 'font-semibold text-ink' : ''"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle v-if="'circle' in item" cx="12" cy="12" r="4" />
            <circle v-if="'head' in item" cx="9" cy="8" r="3.5" />
            <rect
              v-if="'rect' in item"
              x="3"
              :y="item.rect.y"
              width="18"
              :height="item.rect.h"
              rx="3"
            />
            <path v-for="d in item.paths" :key="d" :d="d" />
          </svg>
          <span>{{ $ts(`app.tabs.${item.key}`) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
