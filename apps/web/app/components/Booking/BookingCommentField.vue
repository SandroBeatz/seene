<script setup lang="ts">
const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-2">
    <label for="booking-comment" class="text-[13px] font-semibold text-highlighted">
      {{ $ts('booking.steps.confirm.comment') }}
    </label>
    <UTextarea
      id="booking-comment"
      v-model="model"
      autoresize
      :rows="2"
      :maxrows="5"
      :maxlength="500"
      :placeholder="$ts('booking.steps.confirm.commentPlaceholder')"
      :ui="{ root: 'w-full', base: 'rounded-[16px] px-3.5 py-3 text-[15px]' }"
    />
  </div>
</template>
