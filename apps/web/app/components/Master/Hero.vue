<script setup lang="ts">
import type { MasterPageData } from '#shared/types/master'

const props = defineProps<{
  data: MasterPageData
}>()

const { $t, $ts, getLocale } = useI18n()
const toast = useToast()
const { plural, formatDays, formatHours } = useMasterPageFormat(() => props.data.settings)

const profile = computed(() => props.data.profile)
const fullName = computed(() => `${profile.value.first_name} ${profile.value.last_name}`.trim())
const initials = computed(() =>
  `${profile.value.first_name[0] ?? ''}${profile.value.last_name[0] ?? ''}`.toUpperCase()
)
const specialty = computed(() =>
  profile.value.specializations.map((key) => $t(`specializations.${key}`)).join(', ')
)

const stats = computed(() => {
  const items: { value: string; label: string }[] = []
  const years = profile.value.experience_years

  if (years) {
    items.push({
      value: plural('master.stats.years', years),
      label: $ts('master.stats.experience')
    })
  }

  const visits = props.data.visits_count
  if (visits) {
    const { value, plus } = roundVisits(visits)
    items.push({
      value: `${new Intl.NumberFormat(getLocale()).format(value)}${plus ? '+' : ''}`,
      label: plural('master.stats.visits', value)
    })
  }

  const hours = props.data.working_hours
  if (hours.length) {
    const sameHours = hours.every((r) => r.start === hours[0]!.start && r.end === hours[0]!.end)
    items.push({
      value: mergeWorkingDays(hours).map(formatDays).join(', '),
      label: sameHours ? formatHours(hours[0]!) : $ts('master.stats.hoursVary')
    })
  }

  return items
})

async function share() {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({ title: fullName.value, url })
      return
    }
    await navigator.clipboard.writeText(url)
    toast.add({ title: $ts('master.share.copied'), icon: 'i-lucide-check' })
  } catch {
    // The visitor closed the share sheet.
  }
}
</script>

<template>
  <header>
    <div class="relative h-56 overflow-hidden bg-primary">
      <img
        v-if="profile.cover_url"
        :src="profile.cover_url"
        :alt="$ts('master.poster.alt', { name: fullName })"
        class="size-full object-cover"
        fetchpriority="high"
      />
      <div class="absolute inset-0 bg-linear-to-b from-transparent from-45% to-(--ui-bg)" />
      <UButton
        icon="i-lucide-share"
        color="neutral"
        variant="ghost"
        :aria-label="$ts('master.share.aria')"
        class="absolute top-3 right-4 rounded-full bg-black/20 text-white backdrop-blur hover:bg-black/30"
        @click="share"
      />
    </div>

    <div class="relative -mt-13 flex flex-col gap-3.5 px-5">
      <UAvatar
        :src="profile.avatar_url ?? undefined"
        :text="initials"
        :alt="fullName"
        class="size-23 border-4 border-(--ui-bg) bg-primary"
        :ui="{ fallback: 'text-2xl font-semibold text-inverted' }"
      />

      <div class="flex flex-col gap-1">
        <h1
          class="flex items-center gap-1.5 font-display text-[26px] leading-tight font-bold tracking-tight text-highlighted"
        >
          {{ fullName }}
          <MasterVerifiedBadge v-if="profile.is_verified" />
        </h1>
        <p v-if="specialty" class="text-[15px] text-muted">{{ specialty }}</p>
        <p v-if="profile.city" class="flex items-center gap-1.5 text-sm text-muted">
          <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
          {{ profile.city }}
        </p>
      </div>

      <dl
        v-if="stats.length"
        class="grid divide-x divide-default rounded-2xl border border-default"
        :style="{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }"
      >
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="flex flex-col-reverse gap-0.5 px-2.5 py-3"
        >
          <dt class="text-xs text-muted">{{ stat.label }}</dt>
          <dd class="font-display text-lg font-bold text-highlighted">{{ stat.value }}</dd>
        </div>
      </dl>
    </div>
  </header>
</template>
