<script setup lang="ts">
defineProps<{
  name: string
  specialty: string
  avatar?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-6 px-4 text-center">
    <UAvatar
      :src="avatar"
      :alt="name"
      size="3xl"
      :ui="{ root: 'ring-2 ring-(--ui-color-primary-200)' }"
    />
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold text-(--ui-text-highlighted)">
        {{ name }}
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        {{ specialty }}
      </p>
    </div>
  </div>
</template>
