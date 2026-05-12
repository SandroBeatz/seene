<script setup lang="ts">
withDefaults(
  defineProps<{
    bio?: string
    experience?: string
    location?: string
    instagram?: string
    tiktok?: string
    specializations?: string[]
    worksAtPlace?: boolean
    canTravel?: boolean
  }>(),
  {
    bio: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium aliquid animi culpa delectus dolor doloremque, esse explicabo id incidunt necessitatibus nobis, nulla obcaecati quaerat sapiente sint vero vitae voluptates. Nihil!',
    experience: 'My experiants',
    location: '',
    instagram: 'seene',
    tiktok: 'seene',
    specializations: () => []
  }
)
</script>

<template>
  <div class="flex flex-col gap-6 py-2">
    <div>
      <h4 class="text-lg font-bold text-text mb-2">Обо мне</h4>
      <p v-if="bio" class="text-text leading-relaxed">{{ bio }}</p>
    </div>

    <USeparator v-if="bio" />

    <div class="flex flex-col gap-3">
      <div v-if="experience" class="flex items-center gap-3">
        <UIcon name="i-lucide-briefcase" class="size-5 text-(--ui-text-muted) shrink-0" />
        <div class="flex flex-col">
          <span class="text-xs text-(--ui-text-muted)">{{ $ts('master.about.experience') }}</span>
          <span class="text-sm font-medium text-(--ui-text-highlighted)">{{ experience }}</span>
        </div>
      </div>

      <div v-if="location" class="flex items-center gap-3">
        <UIcon name="i-lucide-map-pin" class="size-5 text-(--ui-text-muted) shrink-0" />
        <div class="flex flex-col">
          <span class="text-xs text-(--ui-text-muted)">{{ $ts('master.about.location') }}</span>
          <span class="text-sm font-medium text-(--ui-text-highlighted)">{{ location }}</span>
        </div>
      </div>
    </div>

    <template v-if="worksAtPlace || canTravel">
      <USeparator />
      <div class="flex flex-col gap-3">
        <span class="text-xs text-(--ui-text-muted)">{{ $ts('master.about.workFormat') }}</span>
        <div v-if="worksAtPlace" class="flex items-center gap-3">
          <UIcon name="i-lucide-home" class="size-5 text-(--ui-text-muted) shrink-0" />
          <span class="text-sm text-(--ui-text-highlighted)">{{
            $ts('master.about.worksAtPlace')
          }}</span>
        </div>
        <div v-if="canTravel" class="flex items-center gap-3">
          <UIcon name="i-lucide-car" class="size-5 text-(--ui-text-muted) shrink-0" />
          <span class="text-sm text-(--ui-text-highlighted)">{{
            $ts('master.about.canTravel')
          }}</span>
        </div>
      </div>
    </template>

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
