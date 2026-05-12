<script setup lang="ts">
defineProps<{
  username: string
  whatsapp?: string
  telegram?: string
}>()

const { $ts, $localePath } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-3">
    <UButton
      :to="$localePath(`/${username}/book`)"
      icon="i-lucide-calendar"
      :label="$ts('master.home.book')"
      color="primary"
      size="xl"
      block
    />
    <UButton
      :to="`https://wa.me/${whatsapp}`"
      target="_blank"
      rel="noopener noreferrer"
      icon="i-simple-icons-whatsapp"
      :label="$ts('master.home.whatsapp')"
      color="neutral"
      variant="outline"
      size="xl"
      block
    />
    <UButton
      v-if="telegram"
      :to="`https://t.me/${telegram}`"
      target="_blank"
      rel="noopener noreferrer"
      icon="i-simple-icons-telegram"
      :label="$ts('master.home.telegram')"
      color="neutral"
      variant="outline"
      size="xl"
      block
    />
  </div>
</template>
