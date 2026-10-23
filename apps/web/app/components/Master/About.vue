<script setup lang="ts">
import type { MasterPageData } from '#shared/types/master'

const props = defineProps<{
  data: MasterPageData
}>()

const { $ts } = useI18n()
const { formatDays, formatHours } = useMasterPageFormat(() => props.data.settings)

const open = ref(false)
const bioRef = useTemplateRef('bio')
const bioClamped = ref(false)

const profile = computed(() => props.data.profile)

const address = computed(() =>
  [
    [profile.value.address, profile.value.house_number].filter(Boolean).join(' '),
    profile.value.city
  ]
    .filter(Boolean)
    .join(', ')
)

const details = computed(() => {
  const rows: { label: string; value: string }[] = []

  if (address.value) rows.push({ label: $ts('master.about.address'), value: address.value })

  if (props.data.working_hours.length) {
    rows.push({
      label: $ts('master.about.hours'),
      value: props.data.working_hours.map((r) => `${formatDays(r)}, ${formatHours(r)}`).join('\n')
    })
  }

  const formats = [
    profile.value.works_at_place && $ts('master.about.worksAtPlace'),
    profile.value.can_travel && $ts('master.about.canTravel')
  ].filter(Boolean)
  if (formats.length) rows.push({ label: $ts('master.about.format'), value: formats.join(', ') })

  return rows
})

const bio = computed(() => profile.value.bio?.trim() ?? '')
const hasMore = computed(() => bioClamped.value || details.value.length > 0)

// "More" is needed when the bio is longer than 3 lines or there are details to reveal.
function measure() {
  if (open.value) return
  const el = bioRef.value
  bioClamped.value = !!el && el.scrollHeight > el.clientHeight + 1
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
</script>

<template>
  <div v-if="bio || details.length" class="flex flex-col gap-1.5">
    <p
      v-if="bio"
      ref="bio"
      class="text-[15px] leading-relaxed whitespace-pre-line text-default"
      :class="{ 'line-clamp-3': !open }"
    >
      {{ bio }}
    </p>

    <dl
      v-if="open && details.length"
      id="master-about-details"
      class="seene-reveal mt-1.5 flex flex-col gap-2 rounded-2xl bg-muted p-3.5 text-sm"
    >
      <div v-for="row in details" :key="row.label" class="flex gap-2.5">
        <dt class="w-16 shrink-0 text-muted">{{ row.label }}</dt>
        <dd class="whitespace-pre-line text-default">{{ row.value }}</dd>
      </div>
    </dl>

    <UButton
      v-if="hasMore"
      variant="link"
      :label="open ? $ts('master.about.less') : $ts('master.about.more')"
      :aria-expanded="open"
      aria-controls="master-about-details"
      class="self-start p-0 text-sm font-semibold text-(--seene-accent-text) hover:text-(--seene-accent-text)"
      @click="open = !open"
    />
  </div>
</template>
