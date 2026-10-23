<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon: string
}>()
</script>

<template>
  <section class="flex min-h-[calc(100dvh-6rem)] flex-col justify-center py-8">
    <div
      class="flex flex-col items-center gap-4 rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-muted)] px-6 py-10 text-center"
    >
      <div
        class="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <UIcon :name="icon" class="size-6" />
      </div>
      <div class="space-y-2">
        <h1 class="text-xl font-semibold text-[var(--ui-text-highlighted)]">
          {{ title }}
        </h1>
        <p class="text-sm leading-6 text-[var(--ui-text-muted)]">
          {{ description }}
        </p>
      </div>
    </div>
  </section>
</template>
