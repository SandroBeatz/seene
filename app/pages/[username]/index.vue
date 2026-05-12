<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { MasterPageData } from '#shared/types/master'

definePageMeta({ layout: 'master' })

const { setTheme } = useMasterTheme()
const route = useRoute()
const { $ts } = useI18n()

const tabState = ref('home')

const username = computed(() => route.params.username as string)

const { data, status, error } = useQuery({
  key: () => ['master', username.value],
  query: () => $fetch<MasterPageData>(`/api/master/${username.value}`)
})

watch(
  error,
  (err) => {
    if (err && (err as { statusCode?: number }).statusCode === 404) {
      throw createError({ statusCode: 404, fatal: true })
    }
  },
  { immediate: true }
)

setTheme({ radius: '0.75rem' })

const tabs = computed<TabsItem[]>(() => [
  { label: $ts('master.tabs.home'), icon: 'i-lucide-home', slot: 'home', value: 'home' },
  {
    label: $ts('master.tabs.services'),
    icon: 'i-lucide-scissors',
    slot: 'services',
    value: 'services'
  },
  {
    label: $ts('master.tabs.portfolio'),
    icon: 'i-lucide-images',
    slot: 'portfolio',
    value: 'portfolio'
  },
  {
    label: $ts('master.tabs.about'),
    icon: 'i-lucide-user-round',
    slot: 'about',
    value: 'about'
  }
])
</script>

<template>
  <div class="max-w-lg mx-auto min-h-screen flex flex-col">
    <template v-if="status === 'pending'">
      <div class="flex flex-col items-center gap-3 py-6 px-4">
        <USkeleton class="size-24 rounded-full" />
        <div class="flex flex-col items-center gap-2">
          <USkeleton class="h-6 w-40" />
          <USkeleton class="h-4 w-28" />
        </div>
      </div>
      <div class="px-4 flex flex-col gap-3 pt-4">
        <USkeleton class="h-12 w-full rounded-lg" />
        <USkeleton class="h-12 w-full rounded-lg" />
      </div>
    </template>

    <template v-else-if="data">
      <MasterProfileHeader
        :first-name="data.profile.first_name"
        :last-name="data.profile.last_name"
        :specializations="data.profile.specializations"
      />

      <UTabs
        v-model="tabState"
        :items="tabs"
        :ui="{ root: 'w-full flex-1', list: 'hidden', content: 'pt-8 px-4 pb-8' }"
      >
        <template #home>
          <MasterTabHome :username="data.profile.username" />
        </template>

        <template #services>
          <MasterTabServices :categories="data.categories" :services="data.services" />
        </template>

        <template #portfolio>
          <MasterTabPortfolio />
        </template>

        <template #about>
          <MasterTabAbout
            :specializations="data.profile.specializations"
            :location="data.profile.city ?? undefined"
            :works-at-place="data.profile.works_at_place"
            :can-travel="data.profile.can_travel"
          />
        </template>
      </UTabs>

      <nav
        :aria-label="$ts('master.tabs.navigationAria')"
        class="mt-auto backdrop-blur bg-white/65 py-2 px-4 sticky bottom-0 z-50"
      >
        <UTabs
          v-model="tabState"
          :items="tabs"
          :content="false"
          size="sm"
          class="w-full"
          :ui="{
            indicator: 'rounded-xl bg-zinc-900',
            trigger:
              'cursor-pointer min-h-14 flex-col gap-1 rounded-xl !border-transparent px-1.5 py-3 text-[11px] font-medium leading-none',
            leadingIcon: 'size-5',
            label: 'max-w-full truncate'
          }"
        />
      </nav>
    </template>
  </div>
</template>
