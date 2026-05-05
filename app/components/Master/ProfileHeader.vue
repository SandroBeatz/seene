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
  <div class="flex flex-col items-center gap-3 py-6 px-4 text-center">
    <UAvatar :alt="initials" size="3xl" :ui="{ root: 'ring-2 ring-(--ui-color-primary-200)' }" />
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold text-(--ui-text-highlighted)">
        {{ firstName }} {{ lastName }}
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        {{ specialtyLabel }}
      </p>
    </div>
  </div>
</template>
