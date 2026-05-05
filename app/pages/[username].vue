<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

interface MasterProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  username: string
  specializations: string[]
  city: string | null
  works_at_place: boolean
  can_travel: boolean
}

interface ServiceCategory {
  id: string
  name: string
  sort_order: number
}

interface MasterService {
  id: string
  category_id: string | null
  name: string
  description: string | null
  duration: number
  price: string
  color: string
  sort_order: number
}

interface MasterPageData {
  profile: MasterProfile
  categories: ServiceCategory[]
  services: MasterService[]
}

definePageMeta({ layout: 'master' })

const { $ts } = useI18n()
const { setTheme } = useMasterTheme()
const route = useRoute()

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
  { label: $ts('master.tabs.home'), slot: 'home', value: 'home' },
  { label: $ts('master.tabs.services'), slot: 'services', value: 'services' },
  { label: $ts('master.tabs.portfolio'), slot: 'portfolio', value: 'portfolio' },
  { label: $ts('master.tabs.about'), slot: 'about', value: 'about' }
])
</script>

<template>
  <div class="max-w-lg mx-auto min-h-screen">
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
        :items="tabs"
        default-value="home"
        variant="link"
        color="primary"
        class="w-full"
        :ui="{ list: 'border-b border-(--ui-border)', content: 'pt-4 px-4 pb-8' }"
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
    </template>
  </div>
</template>
