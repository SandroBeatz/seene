<script setup lang="ts">
const props = defineProps<{
  firstName: string
  lastName: string
  specializations: string[]
}>()

const { $t } = useI18n()

const initials = computed(() =>
  `${props.firstName[0] ?? ''}${props.lastName[0] ?? ''}`.toUpperCase()
)

const specialtyLabel = computed(() =>
  props.specializations.map((key) => $t(`specializations.${key}`)).join(', ')
)
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-6 px-4 text-center bg-white rounded-b-lg">
    <UAvatar :alt="initials" size="3xl" />
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold text-(--ui-text-highlighted)">
        {{ firstName }} {{ lastName }}
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        {{ specialtyLabel }}
      </p>

      <div class="flex justify-center">
        <UBadge icon="i-lucide-badge-check" size="md" color="primary" variant="solid">
          Certified Expert
        </UBadge>
      </div>
    </div>
  </div>
</template>
