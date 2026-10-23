<script setup lang="ts">
const enabled = defineModel<boolean>({ default: true })
</script>

<template>
  <label
    class="flex cursor-pointer items-center justify-between gap-3.5 rounded-[16px] border border-default px-4 py-3.5"
  >
    <span class="flex flex-col gap-0.5">
      <span class="text-[15px] font-semibold text-highlighted">
        {{ $ts('booking.steps.confirm.reminders') }}
      </span>
      <span class="text-[13px] text-muted">{{ $ts('booking.steps.confirm.remindersHint') }}</span>
    </span>
    <USwitch v-model="enabled" size="lg" />
  </label>
</template>
