<script setup lang="ts">
/**
 * One point of a homepage showcase ("Возможности", "Страница мастера"): a
 * heading that switches the phone next to it, a short text, and while it is on,
 * a white card and the slot (the point's checklist).
 */
defineProps<{
  index: number
  title: string
  text: string
  active: boolean
  /** "01" in mono (features) or a round step number (booking) */
  numbering: 'mono' | 'step'
}>()

defineEmits<{ select: [] }>()
</script>

<template>
  <div
    class="flex flex-col gap-2.5 rounded-[20px] border px-5 py-4.5 transition-colors duration-150"
    :class="active ? 'border-line bg-white' : 'border-transparent bg-transparent'"
  >
    <h3 class="m-0">
      <button
        type="button"
        :aria-expanded="active"
        class="flex w-full cursor-pointer items-center gap-4 border-0 bg-transparent p-0 text-left font-display text-[20px] font-semibold tracking-[-0.015em] text-ink"
        @click="$emit('select')"
      >
        <span
          v-if="numbering === 'mono'"
          class="w-6 shrink-0 font-mono text-[12px] font-medium tracking-normal text-ink-muted"
        >
          0{{ index + 1 }}
        </span>
        <span
          v-else
          class="flex size-7 shrink-0 items-center justify-center rounded-full font-sans text-[13px] font-semibold tracking-normal transition-colors duration-150"
          :class="active ? 'bg-ink text-white' : 'bg-[#EDEDEA] text-ink-muted'"
        >
          {{ index + 1 }}
        </span>
        <span>{{ title }}</span>
      </button>
    </h3>
    <p class="m-0 pl-10 text-[15px] leading-[1.55] text-ink-muted">{{ text }}</p>
    <div v-if="active && $slots.default" class="site-rise pl-10">
      <slot />
    </div>
  </div>
</template>
