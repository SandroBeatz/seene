<script setup lang="ts">
import type { MasterService, MasterServiceGroup, ServiceCategory } from '#shared/types/master'

const props = defineProps<{
  categories?: ServiceCategory[]
  services?: MasterService[]
}>()

const galleryPhotos = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
    altKey: 'master.services.details.galleryAlt1',
    rotateClass: '-rotate-3'
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=80',
    altKey: 'master.services.details.galleryAlt2',
    rotateClass: 'rotate-2'
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1599948128020-9a44505b0d1b?auto=format&fit=crop&w=900&q=80',
    altKey: 'master.services.details.galleryAlt3',
    rotateClass: '-rotate-1'
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=80',
    altKey: 'master.services.details.galleryAlt4',
    rotateClass: 'rotate-3'
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=80',
    altKey: 'master.services.details.galleryAlt5',
    rotateClass: '-rotate-2'
  }
]

const showCategoryHeaders = computed(() => (props.categories?.length ?? 0) > 1)

const groups = computed<MasterServiceGroup[]>(() => {
  const items = props.services ?? []
  const cats = props.categories ?? []

  if (!showCategoryHeaders.value) {
    return [{ category: null, items }]
  }

  const grouped: MasterServiceGroup[] = cats
    .map((cat) => ({
      category: cat,
      items: items.filter((s) => s.category_id === cat.id)
    }))
    .filter((g) => g.items.length > 0)

  const uncategorised = items.filter((s) => s.category_id === null)
  if (uncategorised.length > 0) {
    grouped.push({ category: null, items: uncategorised })
  }

  return grouped
})

function serviceDescription(service: MasterService) {
  return service.description?.trim() || null
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UEmpty
      v-if="!services?.length"
      icon="i-lucide-text-search"
      :title="$ts('master.services.empty')"
    />

    <template v-for="group in groups" :key="group.category?.id ?? 'uncategorised'">
      <p
        v-if="group.category"
        class="text-xs font-semibold uppercase tracking-wider text-muted pt-4 pb-1"
      >
        {{ group.category.name }}
      </p>
      <template v-for="service in group.items" :key="service.id">
        <UCard :ui="{ root: 'shadow-none!' }">
          <div class="flex justify-between">
            <div class="flex flex-col gap-2">
              <h3 class="text-lg font-medium text-highlighted">{{ service.name }}</h3>

              <div class="flex gap-2 text-xs">
                <span class="text-subtle"
                  ><UIcon name="i-lucide-clock-9" /> {{ service.duration }}
                  {{ $ts('master.services.duration') }}</span
                >
                <span>|</span>
                <span class="font-bold text-primary shrink-0 whitespace-nowrap">
                  {{ service.price }} {{ $ts('master.services.currency_rub') }}
                </span>
              </div>

              <div>
                <UDrawer
                  direction="bottom"
                  :title="service.name"
                  :ui="{
                    header: 'w-full max-w-lg mx-auto',
                    body: 'overflow-hidden max-w-lg mx-auto'
                  }"
                >
                  <UButton
                    size="xs"
                    variant="link"
                    trailing-icon="i-lucide-arrow-right"
                    :ui="{ base: 'p-0 underline hover:no-underline' }"
                  >
                    {{ $ts('master.services.details.open') }}
                  </UButton>

                  <template #body>
                    <div class="flex flex-col gap-6">
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span class="inline-flex items-center gap-1 text-muted">
                          <UIcon name="i-lucide-clock-9" class="size-4" />
                          {{ service.duration }} {{ $ts('master.services.duration') }}
                        </span>
                        <span class="text-muted">/</span>
                        <span class="font-semibold text-primary">
                          {{ service.price }} {{ $ts('master.services.currency_rub') }}
                        </span>
                      </div>

                      <p class="text-sm leading-6 text-muted">
                        {{
                          serviceDescription(service) ??
                          $ts('master.services.details.descriptionFallback')
                        }}
                      </p>

                      <section class="flex flex-col gap-4">
                        <h4 class="text-sm font-semibold text-highlighted">
                          {{ $ts('master.services.details.galleryTitle') }}
                        </h4>

                        <UCarousel
                          :items="galleryPhotos"
                          loop
                          drag-free
                          :auto-scroll="{ speed: 0.8, stopOnInteraction: false }"
                          :ui="{
                            root: 'overflow-visible',
                            viewport: 'overflow-visible',
                            container: 'items-center py-5',
                            item: 'basis-[72%] sm:basis-[48%] ps-4 first:ps-0'
                          }"
                        >
                          <template #default="{ item }">
                            <div
                              class="aspect-[4/5] overflow-hidden rounded-lg bg-muted shadow-lg shadow-black/10 ring-1 ring-default transition-transform duration-300 hover:scale-[1.03]"
                              :class="item.rotateClass"
                            >
                              <img
                                :src="item.src"
                                :alt="$ts(item.altKey)"
                                class="size-full object-cover"
                              />
                            </div>
                          </template>
                        </UCarousel>
                      </section>
                    </div>
                  </template>
                </UDrawer>
              </div>
            </div>
            <div>
              <UButton>{{ $ts('master.services.select') }}</UButton>
            </div>
          </div>
        </UCard>
      </template>
    </template>
  </div>
</template>
