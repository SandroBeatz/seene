<script setup lang="ts">
defineProps<{
  label: string
  disabled?: boolean
  loading?: boolean
  /** "By tapping, you agree to the privacy policy" under the button. */
  policy?: boolean
}>()

defineEmits<{
  click: []
}>()

const { $localePath } = useI18n()
</script>

<template>
  <div
    class="sticky bottom-0 z-10 mt-auto flex flex-col gap-2.5 bg-linear-to-b from-transparent to-(--ui-bg) to-30% px-4 pt-3.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
  >
    <UButton
      block
      size="xl"
      :label="label"
      :disabled="disabled"
      :loading="loading"
      class="rounded-[16px] px-4.5 py-4 text-base font-semibold"
      @click="$emit('click')"
    />
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
