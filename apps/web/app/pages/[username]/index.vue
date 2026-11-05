<script setup lang="ts">
definePageMeta({ layout: 'master', middleware: 'master-locale' })

const { setTheme, setMasterSettings } = useMasterTheme()
const route = useRoute()

const username = computed(() => route.params.username as string)

const { data, error, refetch, isLoading } = useMasterData(username)
const localeReady = useMasterLocale(username, data)

// The master's theme and color for the layout.
watch(
  () => data.value?.settings,
  (settings) => settings && setMasterSettings(settings),
  { immediate: true }
)

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

useMasterSeo(data)

const bookingEnabled = computed(
  () =>
    !!data.value?.settings.online_booking_enabled &&
    data.value.services.some((service) => service.show_online)
)

const bookingState = useBookingState(username.value)
const { goTo } = useBookingFlow(username)

/** Opens booking over the page: on the time step when a service was picked. */
function book(serviceId?: string) {
  const state = bookingState.value
  const keepChoice = !serviceId || state.selectedServiceIds[0] === serviceId

  // The same service keeps the picked time; another one starts over.
  bookingState.value = createBookingState({
    ...(keepChoice && !state.booking ? state : {}),
    selectedServiceIds: serviceId ? [serviceId] : keepChoice ? state.selectedServiceIds : [],
    phone: state.phone,
    booking: null
  })

  return goTo(serviceId ? 'time' : 'services')
}
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-lg flex-col">
    <template v-if="data && localeReady">
      <MasterHero :data="data" class="seene-reveal" />

      <div class="seene-reveal flex flex-col gap-3.5 px-5 pt-3.5 [animation-delay:60ms]">
        <MasterAbout :data="data" />
        <MasterContacts :profile="data.profile" />
      </div>

      <MasterWorks
        :items="data.portfolio"
        :services="data.services"
        class="seene-reveal px-5 pt-8 [animation-delay:120ms]"
      />

      <MasterServices
        :data="data"
        :booking-enabled="bookingEnabled"
        class="seene-reveal px-5 pt-8 pb-2 [animation-delay:180ms]"
        @book="book"
      />

      <!-- Sticky while scrolling, then settles in place above the footer. -->
      <MasterBookBar :data="data" :booking-enabled="bookingEnabled" @book="book()" />

      <MasterFooter />

      <BookingSheet :data="data" :booking-enabled="bookingEnabled" />
    </template>

    <!-- A failed load on a bad connection: the skeleton must not spin forever. -->
    <div
      v-else-if="error && !isLoading"
      class="seene-reveal flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center"
      role="alert"
    >
      <p class="text-[15px] text-muted">{{ $ts('master.page.loadFailed') }}</p>
      <UButton
        color="neutral"
        variant="outline"
        :label="$ts('master.page.retry')"
        class="rounded-full px-4 font-semibold"
        @click="refetch()"
      />
    </div>

    <MasterSkeleton v-else />
  </div>
</template>
