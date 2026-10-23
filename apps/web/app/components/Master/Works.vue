<script setup lang="ts">
import type { MasterService, PortfolioItem } from '#shared/types/master'

const props = defineProps<{
  items: PortfolioItem[]
  services: MasterService[]
}>()

const { $ts } = useI18n()

const PREVIEW_COUNT = 6

const showAll = ref(false)
const viewerOpen = ref(false)
const activeIndex = ref(0)
const carousel = useTemplateRef('carousel')

const serviceNames = computed(() => new Map(props.services.map((s) => [s.id, s.name])))

const photos = computed(() =>
  props.items.map((item, i) => {
    const service = item.service_id ? serviceNames.value.get(item.service_id) : undefined
    return {
      ...item,
      service,
      alt: service
        ? $ts('master.works.altService', { service })
        : $ts('master.works.alt', { index: i + 1 })
    }
  })
)

const visible = computed(() =>
  showAll.value ? photos.value : photos.value.slice(0, PREVIEW_COUNT)
)
const active = computed(() => photos.value[activeIndex.value])

function openViewer(index: number) {
  activeIndex.value = index
  viewerOpen.value = true
}

// The carousel mounts with the modal; jump to the tapped photo without animating.
watch(
  () => carousel.value?.emblaApi,
  (api) => api?.scrollTo(activeIndex.value, true)
)
</script>

<template>
  <section v-if="photos.length" aria-labelledby="master-works" class="flex flex-col gap-3.5">
    <div class="flex items-baseline justify-between">
      <h2 id="master-works" class="font-display text-xl font-bold tracking-tight text-highlighted">
        {{ $ts('master.works.title') }}
      </h2>
      <UButton
        v-if="photos.length > PREVIEW_COUNT"
        variant="link"
        :label="
          showAll ? $ts('master.works.collapse') : $ts('master.works.all', { count: photos.length })
        "
        class="p-0 text-sm font-semibold text-(--seene-accent-text) hover:text-(--seene-accent-text)"
        @click="showAll = !showAll"
      />
    </div>

    <ul class="grid grid-cols-3 gap-1 overflow-hidden rounded-2xl">
      <li v-for="(photo, i) in visible" :key="photo.id" class="aspect-square bg-muted">
        <button
          type="button"
          class="block size-full cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          :aria-label="$ts('master.works.open', { index: i + 1 })"
          @click="openViewer(i)"
        >
          <img
            :src="photo.photo_url"
            :alt="photo.alt"
            loading="lazy"
            decoding="async"
            class="size-full object-cover transition-transform duration-400 ease-out hover:scale-105"
          />
        </button>
      </li>
    </ul>

    <UModal
      v-model:open="viewerOpen"
      fullscreen
      :title="$ts('master.works.viewer')"
      :ui="{
        content: 'bg-black text-white',
        header: 'border-none',
        title: 'sr-only',
        body: 'flex flex-col justify-center p-0 sm:p-0'
      }"
      :close="{ color: 'neutral', variant: 'ghost', class: 'text-white hover:bg-white/10' }"
    >
      <template #body>
        <UCarousel
          ref="carousel"
          v-slot="{ item }"
          :items="photos"
          arrows
          :prev="{ color: 'neutral', variant: 'ghost', class: 'text-white hidden sm:inline-flex' }"
          :next="{ color: 'neutral', variant: 'ghost', class: 'text-white hidden sm:inline-flex' }"
          class="w-full"
          @select="activeIndex = $event"
        >
          <img
            :src="item.photo_url"
            :alt="item.alt"
            class="mx-auto max-h-[75dvh] w-full object-contain"
          />
        </UCarousel>

        <div class="flex flex-col items-center gap-1 px-4 pt-4 text-center" aria-live="polite">
          <p v-if="active?.service" class="text-base font-semibold">{{ active.service }}</p>
          <p class="text-sm text-white/70">
            {{ $ts('master.works.counter', { index: activeIndex + 1, total: photos.length }) }}
          </p>
        </div>
      </template>
    </UModal>
  </section>
</template>
