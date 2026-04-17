<script setup lang="ts">
const { getLocale, getLocales, switchLocale } = useI18n()

const localeNames: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  ru: 'Русский'
}

const currentLocale = computed(() => getLocale())

const items = computed(() =>
  getLocales().map(locale => ({
    label: localeNames[locale.code] ?? locale.code,
    onSelect() {
      switchLocale(locale.code)
    }
  }))
)
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end' }"
    :modal="false"
  >
    <UButton
      :label="currentLocale"
      color="neutral"
      variant="ghost"
      size="sm"
      trailing-icon="i-lucide-chevron-down"
      class="uppercase font-medium"
    />
  </UDropdownMenu>
</template>
