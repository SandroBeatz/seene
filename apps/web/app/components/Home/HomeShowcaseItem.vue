<script setup lang="ts">
/**
 * One point of a homepage showcase ("Возможности", "Страница мастера") on a
 * wide screen: the whole card switches the phone next to it. A point that is
 * off shows a light card and an arrow on hover; the one that is on is a white
 * card with the slot (the point's checklist).
 */
defineProps<{
  index: number
  title: string
  text: string
  active: boolean
  /** "01" (features) or a round step number (booking) */
  numbering: 'zero' | 'step'
}>()

defineEmits<{ select: [] }>()
</script>

<template>
  <div
    class="group relative flex flex-col gap-2.5 rounded-[20px] border px-5 py-4.5 transition-colors duration-150"
    :class="
      active
        ? 'border-line bg-white'
        : 'cursor-pointer border-transparent bg-transparent hover:border-line hover:bg-white/60'
    "
  >
    <h3 class="m-0">
      <!-- The button stretches over the whole card (after:inset-0) -->
      <button
        type="button"
        :aria-expanded="active"
        class="flex w-full cursor-pointer items-center gap-4 border-0 bg-transparent p-0 text-left font-display text-[20px] font-semibold tracking-[-0.015em] text-ink after:absolute after:inset-0 after:rounded-[20px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ink"
        @click="$emit('select')"
      >
        <span
          v-if="numbering === 'zero'"
          class="w-6 shrink-0 font-sans text-[12px] font-semibold tracking-normal text-ink-muted tabular-nums"
        >
          0{{ index + 1 }}
        </span>
        <span
          v-else
          class="flex size-7 shrink-0 items-center justify-center rounded-full font-sans text-[13px] font-semibold tracking-normal transition-colors duration-150"
          :class="
            active ? 'bg-ink text-white' : 'bg-[#EDEDEA] text-ink-muted group-hover:bg-[#E2E2DE]'
          "
        >
          {{ index + 1 }}
        </span>
        <span class="flex-1">{{ title }}</span>
        <UIcon
          v-if="!active"
          name="i-lucide-arrow-right"
          class="size-4.5 shrink-0 text-ink-muted opacity-40 transition-[opacity,transform] duration-150 group-hover:translate-x-0.5 group-hover:opacity-100"
        />
      </button>
    </h3>
    <p class="m-0 pl-10 text-[15px] leading-[1.55] text-ink-muted">{{ text }}</p>
    <div v-if="active && $slots.default" class="site-rise pl-10">
      <slot />
    </div>
  </div>
</template>
