<script setup lang="ts">
defineProps<{
  label: string
  disabled?: boolean
  loading?: boolean
  /** "By tapping, you agree to the privacy policy" under the button. */
  policy?: boolean
  /** Total on the left of the button: price large, details under it. */
  summary?: { price: string; details: string; aria?: string } | null
  /** The total is a button that goes back to the services. */
  summaryTap?: boolean
}>()

defineEmits<{
  click: []
  summary: []
}>()

const { $localePath } = useI18n()
</script>

<template>
  <div
    class="sticky bottom-0 z-10 mt-auto flex flex-col gap-2.5 bg-linear-to-b from-transparent to-(--ui-bg) to-30% px-4 pt-3.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
  >
    <div class="flex items-center gap-3">
      <component
        :is="summaryTap ? 'button' : 'div'"
        v-if="summary"
        :type="summaryTap ? 'button' : undefined"
        :aria-label="summaryTap ? summary.aria : undefined"
        class="flex min-w-0 flex-1 flex-col gap-0.5 text-start text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="summaryTap && $emit('summary')"
      >
        <span class="font-display text-xl leading-tight font-bold tracking-[-0.02em] whitespace-nowrap">
          {{ summary.price }}
        </span>
        <span class="truncate text-[13px] text-muted">{{ summary.details }}</span>
      </component>
      <UButton
        size="xl"
        :block="!summary"
        :label="label"
        :disabled="disabled"
        :loading="loading"
        class="justify-center rounded-[16px] py-4 text-base font-semibold disabled:bg-accented disabled:text-muted disabled:opacity-100"
        :class="summary ? 'shrink-0 px-5.5' : 'px-4.5'"
        @click="$emit('click')"
      />
    </div>
    <i18n-t
      v-if="policy"
      keypath="booking.footer.policy"
      tag="p"
      class="text-center text-xs leading-normal text-muted"
    >
      <template #link>
        <ULink :to="$localePath('/privacy')" target="_blank" class="text-muted underline">
          {{ $ts('booking.footer.policyLink') }}
        </ULink>
      </template>
    </i18n-t>
  </div>
</template>
