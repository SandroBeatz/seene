<script setup lang="ts">
defineProps<{
  selectedCount: number
  totalPrice: string
  totalDuration: number
}>()

defineEmits<{
  book: []
}>()

const { $ts } = useI18n()
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <div class="flex flex-col gap-1">
      <span class="font-medium">
        {{ $ts('master.services.summary.selectedCount', { count: selectedCount }) }}
      </span>
      <div class="flex gap-1 text-sm font-semibold text-muted">
        <span> {{ totalDuration }} {{ $ts('master.services.duration') }} </span>
        <span>|</span>
        <span> {{ totalPrice }} </span>
      </div>
    </div>

    <UButton
      icon="i-lucide-calendar-check"
      :label="$ts('master.services.summary.book')"
      class="shrink-0"
      @click="$emit('book')"
    />
  </div>
</template>
