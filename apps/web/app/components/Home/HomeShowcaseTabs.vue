<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

/**
 * The showcases' switch on phones and tablets (below `lg`): short tabs on top;
 * the chosen point's text and its screen show under them. On a wide screen the
 * showcase is the list of `HomeShowcaseItem` instead.
 */
const props = defineProps<{
  labels: string[]
  /** Section background the pill track sits on */
  on: 'white' | 'paper'
}>()

const active = defineModel<number>({ required: true })

const items = computed<TabsItem[]>(() =>
  props.labels.map((label, i) => ({ label, value: String(i) }))
)
const value = computed({
  get: () => String(active.value),
  set: (next: string | number) => (active.value = Number(next))
})
</script>

<template>
  <UTabs
    v-model="value"
    :items="items"
    :content="false"
    color="neutral"
    class="w-full"
    :ui="{
      list: [
        'w-full overflow-x-auto rounded-full p-1',
        on === 'white' ? 'bg-surface' : 'border border-line bg-white'
      ],
      indicator: 'rounded-full bg-ink shadow-none',
      trigger:
        'min-w-max flex-1 rounded-full px-2 py-2 text-[13px] sm:px-3.5 sm:text-[14px] font-semibold text-ink-muted data-[state=active]:text-white hover:text-ink data-[state=active]:hover:text-white',
      label: 'leading-[normal]'
    }"
  />
</template>
