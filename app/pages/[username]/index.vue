<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'master', middleware: 'master-locale' })

const { setTheme } = useMasterTheme()
const route = useRoute()
const { $ts, $localePath } = useI18n()

const tabState = ref('home')
const selectedServiceIds = ref<string[]>([])

const username = computed(() => route.params.username as string)

const { data, status, error } = useMasterData(username)
const { formatPrice } = useMasterFormat(() => data.value?.settings)

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

const selectedServices = computed(() =>
  (data.value?.services ?? []).filter((service) => selectedServiceIds.value.includes(service.id))
)

const selectedServicesCount = computed(() => selectedServices.value.length)

const totalDuration = computed(() =>
  selectedServices.value.reduce((total, service) => total + service.duration, 0)
)

const totalPrice = computed(() =>
  selectedServices.value.reduce((total, service) => total + priceToNumber(service.price), 0)
)

const formattedTotalPrice = computed(() => formatPrice(totalPrice.value))

const scrollToPageTop = () => {
  if (import.meta.server) return

  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function bookSelectedServices() {
  const bookingState = useBookingState(username.value)

  bookingState.value = {
    step: 2,
    selectedServiceIds: [...selectedServiceIds.value],
    selectedDate: null,
    selectedSlot: null,
    note: '',
    phone: '',
    otpToken: '',
    booking: null
  }

  return navigateTo($localePath(`/${username.value}/book`))
}
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
        :avatar="data.profile.avatar_url ?? undefined"
      />

      <UTabs
        v-model="tabState"
        :items="tabs"
        :ui="{ root: 'w-full flex-1', list: 'hidden', content: 'pt-8 px-4 pb-8' }"
      >
        <template #home>
          <MasterTabHome
            :username="data.profile.username"
            :booking-enabled="data.settings.online_booking_enabled"
            :whatsapp="data.profile.whatsapp ?? undefined"
            :telegram="data.profile.telegram ?? undefined"
          />
        </template>

        <template #services>
          <MasterTabServices
            v-model="selectedServiceIds"
            :categories="data.categories"
            :services="data.services"
            :currency="data.settings.currency"
          />
        </template>

        <template #portfolio>
          <MasterTabPortfolio />
        </template>

        <template #about>
          <MasterTabAbout
            :bio="data.profile.bio ?? undefined"
            :specializations="data.profile.specializations"
            :location="data.profile.city ?? undefined"
            :works-at-place="data.profile.works_at_place"
            :can-travel="data.profile.can_travel"
            :whatsapp="data.profile.whatsapp ?? undefined"
            :telegram="data.profile.telegram ?? undefined"
            :instagram="data.profile.instagram ?? undefined"
            :tiktok="data.profile.tiktok ?? undefined"
            :contact-email="data.profile.contact_email ?? undefined"
          />
        </template>
      </UTabs>

      <nav
        :aria-label="$ts('master.tabs.navigationAria')"
        class="mt-auto backdrop-blur bg-white/65 py-2 px-4 sticky bottom-0 rounded-t-lg z-50"
        @click.capture="scrollToPageTop"
      >
        <MasterServicesSummary
          v-if="
            selectedServicesCount > 0 &&
            tabState === 'services' &&
            data?.settings.online_booking_enabled
          "
          class="py-2 mb-2"
          :selected-count="selectedServicesCount"
          :total-price="formattedTotalPrice"
          :total-duration="totalDuration"
          @book="bookSelectedServices"
        />

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
