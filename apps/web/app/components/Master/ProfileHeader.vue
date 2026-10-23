<script setup lang="ts">
const props = defineProps<{
  firstName: string
  lastName: string
  specializations: string[]
  avatar?: string
}>()

const { $t, $ts } = useI18n()

const initials = computed(() =>
  `${props.firstName[0] ?? ''}${props.lastName[0] ?? ''}`.toUpperCase()
)

const fullName = computed(() => `${props.firstName} ${props.lastName}`.trim())

const specialtyLabel = computed(() =>
  props.specializations.map((key) => $t(`specializations.${key}`)).join(', ')
)
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-6 px-4 text-center bg-neutral-100 rounded-b-xl">
    <UAvatar :src="avatar" :text="initials" :alt="fullName" size="3xl" />
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold text-highlighted">{{ firstName }} {{ lastName }}</h1>
      <p class="text-sm text-muted">
        {{ specialtyLabel }}
      </p>

      <div class="flex justify-center">
        <UBadge icon="i-lucide-badge-check" size="md" color="primary" variant="solid">
          {{ $ts('master.profile.certifiedExpert') }}
        </UBadge>
      </div>
    </div>
  </div>
</template>
