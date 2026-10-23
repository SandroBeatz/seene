<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 22 })

const { $ts } = useI18n()
</script>

<template>
  <UPopover :content="{ side: 'bottom', align: 'start' }">
    <button
      type="button"
      class="inline-flex shrink-0 cursor-pointer rounded-full text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :aria-label="$ts('master.verified.label')"
    >
      <!-- Scalloped seal with a check, like Instagram's: no icon set has this shape. -->
      <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true">
        <polygon
          points="12,1 14.41,3.02 17.5,2.47 18.58,5.42 21.53,6.5 20.98,9.59 23,12 20.98,14.41 21.53,17.5 18.58,18.58 17.5,21.53 14.41,20.98 12,23 9.59,20.98 6.5,21.53 5.42,18.58 2.47,17.5 3.02,14.41 1,12 3.02,9.59 2.47,6.5 5.42,5.42 6.5,2.47 9.59,3.02"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
        <path
          d="M7.8 12.3l2.8 2.8 5.6-6"
          fill="none"
          stroke="var(--ui-text-inverted)"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <template #content>
      <p class="max-w-64 px-3 py-2 font-sans text-sm font-normal tracking-normal text-default">
        {{ $ts('master.verified.hint') }}
      </p>
    </template>
  </UPopover>
</template>
