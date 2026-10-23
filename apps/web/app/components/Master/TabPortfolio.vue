<script setup lang="ts">
interface Photo {
  id: number
  src: string
  alt: string
}

const photos: Photo[] = [
  { id: 1, src: 'https://picsum.photos/seed/nails1/400/400', alt: 'Portfolio photo 1' },
  { id: 2, src: 'https://picsum.photos/seed/nails2/400/400', alt: 'Portfolio photo 2' },
  { id: 3, src: 'https://picsum.photos/seed/nails3/400/400', alt: 'Portfolio photo 3' },
  { id: 4, src: 'https://picsum.photos/seed/nails4/400/400', alt: 'Portfolio photo 4' },
  { id: 5, src: 'https://picsum.photos/seed/nails5/400/400', alt: 'Portfolio photo 5' },
  { id: 6, src: 'https://picsum.photos/seed/nails6/400/400', alt: 'Portfolio photo 6' },
  { id: 7, src: 'https://picsum.photos/seed/nails7/400/400', alt: 'Portfolio photo 7' },
  { id: 8, src: 'https://picsum.photos/seed/nails8/400/400', alt: 'Portfolio photo 8' },
  { id: 9, src: 'https://picsum.photos/seed/nails9/400/400', alt: 'Portfolio photo 9' }
]

const selectedPhoto = ref<Photo | null>(null)

function openPhoto(photo: Photo) {
  selectedPhoto.value = photo
}

function closePhoto() {
  selectedPhoto.value = null
}
</script>

<template>
  <div>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      <button
        v-for="photo in photos"
        :key="photo.id"
        class="aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        @click="openPhoto(photo)"
      >
        <img
          :src="photo.src"
          :alt="photo.alt"
          class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
        />
      </button>
    </div>

    <UModal
      :open="!!selectedPhoto"
      :ui="{ content: 'max-w-xl p-0 overflow-hidden' }"
      @update:open="closePhoto"
    >
      <template #content>
        <div class="relative">
          <img
            v-if="selectedPhoto"
            :src="selectedPhoto.src"
            :alt="selectedPhoto.alt"
            class="w-full h-auto"
          />
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="solid"
            size="sm"
            :aria-label="$ts('master.portfolio.close')"
            class="absolute top-2 right-2"
            @click="closePhoto"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
