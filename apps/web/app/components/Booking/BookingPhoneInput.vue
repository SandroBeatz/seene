<script setup lang="ts">
import {
  getCountries,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode
} from 'libphonenumber-js'
import examples from 'libphonenumber-js/mobile/examples'

interface CountryItem {
  code: CountryCode
  name: string
  dial: string
  flag: string
}

const props = defineProps<{
  /** Fallback country for national input, e.g. the master's country ('KG'). */
  defaultCountry?: string | null
  disabled?: boolean
  invalid?: boolean
  /** Right of the number: a spinner while it is being checked, a check mark when it is fine. */
  status?: 'checking' | 'ready' | null
}>()

/**
 * Canonical phone: digits only, no '+' or spaces ('996555123456') when the
 * typed number is valid, '' otherwise. Formatting lives only in `display`.
 */
const model = defineModel<string>({ default: '' })

const emit = defineEmits<{
  submit: []
}>()

const { $ts, getLocale } = useI18n()

const country = ref<CountryCode | undefined>(initialCountry())
const display = ref('')
showCanonical(model.value)

const countries = computed<CountryItem[]>(() => {
  const names = new Intl.DisplayNames([getLocale()], { type: 'region' })
  return getCountries()
    .map((code) => ({
      code,
      name: names.of(code) ?? code,
      dial: dialCode(code),
      flag: countryFlag(code)
    }))
    .sort((a, b) => a.name.localeCompare(b.name, getLocale()))
})

const selectedCountry = computed(() => countries.value.find((item) => item.code === country.value))
const isInternational = computed(() => display.value.startsWith('+'))

// Example in international grouping without the calling code ('555 123 456'):
// the dial code is already shown as a prefix, so no national trunk '0'/'8'.
const placeholder = computed(() => {
  if (!country.value) return '+'
  const example = getExampleNumber(country.value, examples)
  if (!example) return ''
  return example.formatInternational().replace(`+${example.countryCallingCode}`, '').trim()
})

/**
 * Show a canonical number as national digits after the dial-code prefix,
 * grouped the way that country writes it ('555 123 456').
 */
function showCanonical(value: string) {
  const parsed = value ? parsePhoneNumberFromString(`+${value}`) : undefined
  if (!parsed?.country) return
  country.value = parsed.country
  display.value = resolvePhoneInput(parsed.nationalNumber, parsed.country).display
}

function initialCountry(): CountryCode | undefined {
  const browserRegion = import.meta.client ? navigator.language.split('-')[1] : undefined
  return toPhoneCountry(props.defaultCountry) ?? toPhoneCountry(browserRegion)
}

function onInput(value: string | number) {
  const state = resolvePhoneInput(String(value ?? ''), country.value)
  display.value = state.display
  if (state.country) country.value = state.country
  model.value = state.canonical
}

function onCountryChange(code: CountryCode) {
  country.value = code
  // A '+…' number already carries its own country; switching starts it over.
  onInput(isInternational.value ? '' : display.value)
}

// External changes: a reset clears the field, a restored number fills it.
watch(model, (value) => {
  const shown = resolvePhoneInput(display.value, country.value).canonical
  if (value === shown) return
  if (!value) {
    if (shown) display.value = ''
    return
  }
  showCanonical(value)
})
</script>

<template>
  <div
    class="flex w-full items-stretch overflow-hidden rounded-[16px] border-2 bg-elevated transition-colors"
    :class="invalid ? 'border-error' : 'border-primary'"
  >
    <USelectMenu
      :model-value="country"
      :items="countries"
      value-key="code"
      label-key="name"
      :filter-fields="['name', 'code', 'dial']"
      :search-input="{ placeholder: $ts('booking.phone.searchCountry'), icon: 'i-lucide-search' }"
      :content="{ align: 'start' }"
      :disabled="disabled"
      :aria-label="$ts('booking.phone.country')"
      variant="none"
      trailing-icon="i-lucide-chevron-down"
      :ui="{
        base: 'h-auto shrink-0 gap-1.5 rounded-none border-e border-default py-4 ps-3.5 pe-8 text-base font-medium text-highlighted md:text-base',
        trailing: 'pe-3',
        content: 'w-72',
        trailingIcon: 'size-3.5 text-highlighted',
        placeholder: 'hidden'
      }"
      @update:model-value="onCountryChange"
    >
      <span v-if="selectedCountry" class="whitespace-nowrap">
        {{ selectedCountry.code }} {{ selectedCountry.dial }}
      </span>
      <UIcon v-else name="i-lucide-globe" class="size-5 text-muted" />
      <template #item-leading="{ item }">
        <span class="text-lg leading-none">{{ item.flag }}</span>
      </template>
      <template #item-label="{ item }">
        <span class="truncate">{{ item.name }}</span>
        <span class="ms-1 text-muted">{{ item.dial }}</span>
      </template>
    </USelectMenu>
    <UInput
      :model-value="display"
      type="tel"
      inputmode="tel"
      autocomplete="tel"
      :placeholder="placeholder"
      :disabled="disabled"
      variant="none"
      :aria-label="$ts('booking.steps.confirm.phone')"
      :aria-invalid="invalid"
      class="min-w-0 flex-1"
      :ui="{ base: 'h-full px-3.5 py-4 text-lg font-medium tracking-wide text-highlighted md:text-lg' }"
      @update:model-value="onInput"
      @keydown.enter.prevent="emit('submit')"
    />
    <span v-if="status" class="flex w-10 shrink-0 items-center justify-center pe-3">
      <span
        v-if="status === 'checking'"
        role="status"
        :aria-label="$ts('booking.steps.confirm.checkingPhone')"
        class="size-4 animate-spin rounded-full border-2 border-default border-t-(--ui-text-muted) motion-reduce:animate-[spin_2.4s_linear_infinite]"
      />
      <span
        v-else
        role="img"
        :aria-label="$ts('booking.steps.confirm.phoneOk')"
        class="flex size-5 items-center justify-center rounded-full bg-success text-white"
      >
        <UIcon name="i-lucide-check" class="size-3.5" />
      </span>
    </span>
  </div>
</template>
