<script setup lang="ts">
definePageMeta({ layout: 'master', middleware: 'master-locale' })

const { setTheme, setMasterSettings } = useMasterTheme()
const route = useRoute()
const { $localePath } = useI18n()

const username = computed(() => route.params.username as string)

const { data, status, error } = useMasterData(username)

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

/** Opens booking: on the time step when a service was picked, else on the service step. */
function book(serviceId?: string) {
  const bookingState = useBookingState(username.value)

  bookingState.value = createBookingState({
    step: serviceId ? 2 : 1,
    selectedServiceIds: serviceId ? [serviceId] : [],
    phone: bookingState.value.phone
  })

  return navigateTo($localePath(`/${username.value}/book`))
}
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-lg flex-col">
    <template v-if="status === 'pending' && !data">
      <USkeleton class="h-56 rounded-none" />
      <div class="-mt-13 flex flex-col gap-3 px-5">
        <USkeleton class="size-23 rounded-full border-4 border-(--ui-bg)" />
        <USkeleton class="h-7 w-48" />
        <USkeleton class="h-4 w-32" />
        <USkeleton class="mt-2 h-16 w-full rounded-[16px]" />
      </div>
    </template>

    <template v-else-if="data">
      <MasterHero :data="data" />

      <div class="flex flex-col gap-3.5 px-5 pt-3.5">
        <MasterAbout :data="data" />
        <MasterContacts :profile="data.profile" />
      </div>

      <MasterWorks
        :items="data.portfolio"
        :services="data.services"
        class="seene-reveal px-5 pt-8"
      />

      <MasterServices
        :data="data"
        :booking-enabled="bookingEnabled"
        class="seene-reveal px-5 pt-8 pb-2"
        @book="book"
      />

      <!-- Sticky while scrolling, then settles in place above the footer. -->
      <MasterBookBar :data="data" :booking-enabled="bookingEnabled" @book="book()" />

      <MasterFooter />
    </template>
  </div>
</template>
