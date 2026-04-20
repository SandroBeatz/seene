<script setup lang="ts">
defineProps<{
  bio: string
  experience: string
  location: string
  instagram?: string
  tiktok?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-6 py-2">
    <!-- Bio -->
    <p class="text-(--ui-text) leading-relaxed">{{ bio }}</p>

    <USeparator />

    <!-- Experience & Location -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-briefcase" class="size-5 text-(--ui-text-muted) shrink-0" />
        <div class="flex flex-col">
          <span class="text-xs text-(--ui-text-muted)">{{ $ts('master.about.experience') }}</span>
          <span class="text-sm font-medium text-(--ui-text-highlighted)">{{ experience }}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-map-pin" class="size-5 text-(--ui-text-muted) shrink-0" />
        <div class="flex flex-col">
          <span class="text-xs text-(--ui-text-muted)">{{ $ts('master.about.location') }}</span>
          <span class="text-sm font-medium text-(--ui-text-highlighted)">{{ location }}</span>
        </div>
      </div>
    </div>

    <!-- Socials -->
    <template v-if="instagram || tiktok">
      <USeparator />
      <div class="flex flex-col gap-2">
        <span class="text-xs text-(--ui-text-muted)">{{ $ts('master.about.socials') }}</span>
        <div class="flex gap-2">
          <UButton
            v-if="instagram"
            :to="`https://instagram.com/${instagram}`"
            target="_blank"
            rel="noopener noreferrer"
            icon="i-simple-icons-instagram"
            :aria-label="$ts('master.about.instagramAria')"
            color="neutral"
            variant="outline"
            size="sm"
          />
          <UButton
            v-if="tiktok"
            :to="`https://tiktok.com/@${tiktok}`"
            target="_blank"
            rel="noopener noreferrer"
            icon="i-simple-icons-tiktok"
            :aria-label="$ts('master.about.tiktokAria')"
            color="neutral"
            variant="outline"
            size="sm"
          />
        </div>
      </div>
    </template>
  </div>
</template>
