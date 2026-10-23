<script setup lang="ts">
import type { BookingLinkData, MasterPageData } from '#shared/types/master'

definePageMeta({ layout: 'master' })

const route = useRoute()
const { $ts, $t, getLocale, $localePath } = useI18n()
const { setTheme, setMasterSettings } = useMasterTheme()

const token = computed(() => route.params.token as string)

// The link is personal: keep it out of search and out of the Referer header
// of the WhatsApp and map links on this page.
useSeoMeta({ title: () => $ts('cancel.seo.title'), robots: 'noindex, nofollow' })
useHead({ meta: [{ name: 'referrer', content: 'no-referrer' }] })

const {
  data: link,
  error: linkError,
  refetch: refetchLink
} = useQuery({
  key: () => ['booking-link', token.value],
  query: () => $fetch<BookingLinkData>(`/api/c/${token.value}`)
})

const username = computed(() => link.value?.username ?? '')
const { data: master } = useQuery({
  key: () => ['master', username.value],
  query: () => $fetch<MasterPageData>(`/api/master/${username.value}`),
  enabled: () => !!username.value
})

watch(
  linkError,
  (err) => {
    if (err && (err as { statusCode?: number }).statusCode === 404) {
      throw createError({ statusCode: 404, fatal: true })
    }
  },
  { immediate: true }
)

watch(
  () => master.value?.settings,
  (settings) => settings && setMasterSettings(settings),
  { immediate: true }
)
setTheme({ radius: '0.75rem' })

const profile = computed(() => master.value?.profile)
const booking = computed(() => link.value?.booking ?? null)
const state = computed(() => link.value?.state)
const timezone = computed(() => master.value?.timezone ?? 'UTC')
const { formatPrice, formatTime } = useMasterFormat(() => master.value?.settings, timezone)

const fullName = computed(() =>
  profile.value ? `${profile.value.first_name} ${profile.value.last_name}`.trim() : ''
)
const initials = computed(() =>
  profile.value
    ? `${profile.value.first_name[0] ?? ''}${profile.value.last_name[0] ?? ''}`.toUpperCase()
    : ''
)
const subtitle = computed(() =>
  [
    profile.value?.specializations.map((key) => $t(`specializations.${key}`)).join(', '),
    profile.value?.city
  ]
    .filter(Boolean)
    .join(' · ')
)

const serviceName = computed(() => booking.value?.services.map((s) => s.name).join(' + ') ?? '')

const price = computed(() => {
  if (booking.value?.price === null || booking.value?.price === undefined) return ''
  const amount = formatPrice(booking.value.price)
  return booking.value.services.some((s) => s.price_from)
    ? $ts('booking.service.priceFrom', { price: amount })
    : amount
})

const address = computed(() =>
  profile.value?.works_at_place
    ? [
        [profile.value.address, profile.value.house_number].filter(Boolean).join(' '),
        profile.value.city
      ]
        .filter(Boolean)
        .join(', ')
    : ''
)

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDay(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(getLocale(), { ...options, timeZone: timezone.value }).format(
    new Date(value)
  )
}

/** "Fri, 24 October, 11:30" */
const when = computed(() =>
  booking.value
    ? `${capitalize(formatDay(booking.value.starts_at, { weekday: 'short', day: 'numeric', month: 'long' }))}, ${formatTime(booking.value.starts_at)}`
    : ''
)

/** "Friday, 24 October, 11:30" for the confirmation sheet */
const whenLong = computed(() =>
  booking.value
    ? `${capitalize(formatDay(booking.value.starts_at, { weekday: 'long', day: 'numeric', month: 'long' }))}, ${formatTime(booking.value.starts_at)}`
    : ''
)

/** "23:30, 23 October" */
const cancelUntil = computed(() =>
  booking.value
    ? `${formatTime(booking.value.cancel_until)}, ${formatDay(booking.value.cancel_until, { day: 'numeric', month: 'long' })}`
    : ''
)

const status = computed(() => {
  if (state.value === 'cancelled') {
    return { label: $ts('cancel.status.cancelled'), color: 'neutral' as const }
  }
  return booking.value?.status === 'confirmed'
    ? { label: $ts('cancel.status.confirmed'), color: 'success' as const }
    : { label: $ts('cancel.status.pending'), color: 'warning' as const }
})

const title = computed(() => {
  if (state.value === 'moved') return $ts('cancel.titleMoved')
  if (state.value === 'cancelled') return $ts('cancel.titleCancelled')
  if (state.value === 'past') return $ts('cancel.titlePast')
  return $ts('cancel.title')
})

const cancelWindowHours = computed(() => master.value?.settings.cancel_window_hours ?? 12)

const whatsappUrl = computed(() =>
  profile.value?.whatsapp
    ? whatsappLink(profile.value.whatsapp, $ts('cancel.whatsappText', { when: when.value }))
    : null
)

// --- Move and book again ---

/** The booked services the master still takes online. */
const bookableServiceIds = computed(() => {
  const online = new Set(
    (master.value?.services ?? []).filter((s) => s.show_online).map((s) => s.id)
  )
  return (booking.value?.services ?? []).map((s) => s.id).filter((id) => online.has(id))
})

// Moving keeps the same services, so every one of them must still be bookable.
const canMove = computed(
  () =>
    !!master.value?.settings.online_booking_enabled &&
    !!booking.value?.services.length &&
    bookableServiceIds.value.length === booking.value.services.length
)

const rescheduleOpen = ref(false)
// Survives the switch to the new booking's link, to say it was moved.
const movedNotice = useState('booking-link-moved', () => false)
const justMoved = ref(movedNotice.value)
movedNotice.value = false

async function onMoved(newToken: string) {
  movedNotice.value = true
  await navigateTo($localePath(`/c/${newToken}`), { replace: true })
  rescheduleOpen.value = false
}

async function onMoveUnavailable() {
  rescheduleOpen.value = false
  await refetchLink()
}

/** "Book again": the booking flow over the master's page, on the time step. */
function bookAgain() {
  if (!username.value) return
  const bookingState = useBookingState(username.value)
  const serviceIds = bookableServiceIds.value

  bookingState.value = createBookingState({
    phone: bookingState.value.phone,
    selectedServiceIds: serviceIds
  })

  return navigateTo({
    path: $localePath(`/${username.value}`),
    query: { book: serviceIds.length ? 'time' : 'services' }
  })
}

// --- Cancel ---

const sheetOpen = ref(false)
const reason = ref('')
const cancelling = ref(false)
const cancelError = ref('')

async function confirmCancel() {
  if (cancelling.value) return
  cancelling.value = true
  cancelError.value = ''

  try {
    await $fetch(`/api/c/${token.value}/cancel`, {
      method: 'POST',
      body: { reason: reason.value.trim() || undefined }
    })
    // The new state first, so the old one does not flash as the sheet closes.
    await refetchLink()
    sheetOpen.value = false
  } catch (e: unknown) {
    const code = (e as { data?: { data?: { code?: string } } }).data?.data?.code
    if (code === 'cancel_window_closed') {
      await refetchLink()
      sheetOpen.value = false
    } else {
      cancelError.value = $ts('cancel.errors.cancelFailed')
    }
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-lg flex-col">
    <div v-if="!link || !master" class="flex flex-col gap-5 px-5 pt-5">
      <div class="flex items-center gap-2.5">
        <USkeleton class="size-9 rounded-full" />
        <div class="flex flex-col gap-1.5">
          <USkeleton class="h-4 w-36" />
          <USkeleton class="h-3 w-28" />
        </div>
      </div>
      <USkeleton class="h-6 w-28 rounded-full" />
      <USkeleton class="h-8 w-48" />
      <USkeleton class="h-48 w-full rounded-[18px]" />
    </div>

    <section v-else class="seene-reveal flex flex-1 flex-col gap-5 px-5 pt-5 pb-8">
      <NuxtLink
        :to="$localePath(`/${username}`)"
        class="flex items-center gap-2.5 self-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <UAvatar
          :src="profile?.avatar_url ?? undefined"
          :text="initials"
          :alt="fullName"
          class="size-9 bg-primary"
          :ui="{ fallback: 'text-xs font-semibold text-inverted' }"
        />
        <span class="flex flex-col">
          <span class="flex items-center gap-1 text-sm font-semibold text-highlighted">
            {{ fullName }}
            <MasterVerifiedBadge v-if="profile?.is_verified" :size="15" />
          </span>
          <span v-if="subtitle" class="text-xs text-muted">{{ subtitle }}</span>
        </span>
      </NuxtLink>

      <UAlert
        v-if="justMoved && state === 'open'"
        color="success"
        variant="subtle"
        icon="i-lucide-calendar-check"
        class="rounded-[14px]"
        :title="$ts('cancel.reschedule.done')"
        :description="$ts('cancel.reschedule.doneNote')"
      />

      <div class="flex flex-col items-start gap-2.5">
        <UBadge
          v-if="booking"
          :color="status.color"
          variant="soft"
          class="gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          :class="{ 'bg-muted text-muted': state === 'cancelled' }"
        >
          <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
          {{ status.label }}
        </UBadge>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.03em] text-highlighted">
          {{ title }}
        </h1>
      </div>

      <dl
        v-if="booking"
        class="rounded-[18px] border border-default px-4 py-1 text-sm transition-opacity"
        :class="{ 'opacity-55': state === 'cancelled' }"
      >
        <div class="flex justify-between gap-3 border-b border-default py-3">
          <dt class="text-muted">{{ $ts('cancel.rows.service') }}</dt>
          <dd class="text-right font-semibold text-highlighted">{{ serviceName }}</dd>
        </div>
        <div
          class="flex justify-between gap-3 py-3"
          :class="{ 'border-b border-default': address || price }"
        >
          <dt class="text-muted">{{ $ts('cancel.rows.when') }}</dt>
          <dd class="text-right font-semibold text-highlighted">{{ when }}</dd>
        </div>
        <div
          v-if="address"
          class="flex justify-between gap-3 py-3"
          :class="{ 'border-b border-default': price }"
        >
          <dt class="text-muted">{{ $ts('cancel.rows.address') }}</dt>
          <dd class="text-right text-highlighted">{{ address }}</dd>
        </div>
        <div v-if="price" class="flex justify-between gap-3 py-3">
          <dt class="text-muted">{{ $ts('cancel.rows.price') }}</dt>
          <dd class="text-right font-semibold text-highlighted">{{ price }}</dd>
        </div>
      </dl>

      <div v-if="state === 'open'" class="flex flex-col gap-2.5">
        <UButton
          v-if="canMove"
          color="neutral"
          variant="outline"
          size="xl"
          block
          :label="$ts('cancel.move')"
          class="justify-center rounded-[16px] py-3.5 text-[15px] font-semibold"
          @click="rescheduleOpen = true"
        />
        <UButton
          color="error"
          variant="ghost"
          size="xl"
          block
          :label="$ts('cancel.cancel')"
          class="justify-center rounded-[16px] py-3.5 text-[15px] font-semibold"
          @click="sheetOpen = true"
        />
        <p class="text-center text-[13px] leading-normal text-muted">
          {{ $ts('cancel.cancelUntil', { when: cancelUntil }) }}
        </p>
      </div>

      <div v-else-if="state === 'late'" class="flex flex-col gap-3">
        <div
          class="flex items-start gap-2.5 rounded-[14px] bg-muted p-3.5 text-sm leading-normal text-highlighted"
          role="status"
        >
          <UIcon name="i-lucide-clock" class="mt-0.5 size-4.5 shrink-0" />
          <span>
            {{ $ts('cancel.late', { hours: cancelWindowHours, name: profile?.first_name ?? '' }) }}
          </span>
        </div>
        <UButton
          v-if="whatsappUrl"
          :to="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          size="xl"
          block
          icon="i-simple-icons-whatsapp"
          :label="$ts('cancel.whatsapp')"
          class="justify-center rounded-[16px] bg-[#0E7A3F] py-3.5 text-[15px] font-semibold text-white hover:bg-[#0B6633]"
        />
      </div>

      <div v-else-if="state === 'cancelled'" class="flex flex-col gap-3">
        <p class="text-sm leading-relaxed text-muted">{{ $ts('cancel.cancelledNote') }}</p>
        <UButton
          size="xl"
          block
          :label="$ts('cancel.bookAgain')"
          class="justify-center rounded-[16px] py-4 text-base font-semibold"
          @click="bookAgain()"
        />
      </div>

      <div v-else-if="state === 'moved'" class="flex flex-col gap-3">
        <div
          class="flex items-start gap-2.5 rounded-[14px] bg-muted p-3.5 text-sm leading-normal text-highlighted"
          role="status"
        >
          <UIcon name="i-lucide-calendar-check" class="mt-0.5 size-4.5 shrink-0" />
          <span>{{ $ts('cancel.movedNote') }}</span>
        </div>
        <UButton
          :to="$localePath(`/${username}`)"
          color="neutral"
          variant="outline"
          size="xl"
          block
          :label="$ts('cancel.toProfile')"
          class="justify-center rounded-[16px] py-3.5 text-[15px] font-semibold"
        />
      </div>

      <div v-else-if="state === 'past'" class="flex flex-col gap-3">
        <p class="text-sm leading-relaxed text-muted">{{ $ts('cancel.pastNote') }}</p>
        <UButton
          :to="$localePath(`/${username}`)"
          size="xl"
          block
          :label="$ts('cancel.toProfile')"
          class="justify-center rounded-[16px] py-4 text-base font-semibold"
        />
      </div>
    </section>

    <BookingReschedule
      v-if="master && booking && canMove"
      v-model:open="rescheduleOpen"
      :data="master"
      :token="token"
      :starts-at="booking.starts_at"
      :service-ids="bookableServiceIds"
      @moved="onMoved"
      @unavailable="onMoveUnavailable"
    />

    <UDrawer
      v-model:open="sheetOpen"
      :title="$ts('cancel.sheet.title')"
      :description="$ts('cancel.sheet.description', { when: whenLong })"
      :ui="{
        content: 'mx-auto max-w-lg rounded-t-[28px] bg-default',
        header: 'px-5 pt-2',
        title: 'font-display text-[22px] font-bold tracking-[-0.02em] text-highlighted',
        description: 'text-sm leading-normal text-muted',
        body: 'px-5',
        footer: 'px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]'
      }"
    >
      <template #body>
        <UFormField
          :label="$ts('cancel.sheet.reason')"
          :ui="{ label: 'text-[13px] font-semibold' }"
        >
          <UInput
            v-model="reason"
            :placeholder="$ts('cancel.sheet.reasonPlaceholder')"
            :maxlength="200"
            size="xl"
            class="w-full"
            :ui="{ base: 'rounded-[14px] bg-elevated py-3.5 text-base' }"
          />
        </UFormField>
        <p v-if="cancelError" class="mt-2 text-[13px] text-error" role="alert">{{ cancelError }}</p>
      </template>
      <template #footer>
        <UButton
          color="error"
          size="xl"
          block
          :loading="cancelling"
          :label="$ts('cancel.sheet.confirm')"
          class="justify-center rounded-[16px] py-4 text-base font-semibold"
          @click="confirmCancel"
        />
        <UButton
          color="neutral"
          variant="soft"
          size="xl"
          block
          :label="$ts('cancel.sheet.keep')"
          class="justify-center rounded-[16px] bg-muted py-3.5 text-base font-semibold text-highlighted"
          @click="sheetOpen = false"
        />
      </template>
    </UDrawer>
  </div>
</template>
