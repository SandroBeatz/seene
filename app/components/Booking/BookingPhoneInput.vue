<script setup lang="ts">
import { getCountries, getExampleNumber, type CountryCode } from 'libphonenumber-js'
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
}>()

/** E.164 ('+996555123456') when the typed number is valid, '' otherwise. */
const model = defineModel<string>({ default: '' })

const emit = defineEmits<{
  submit: []
}>()

const { $ts, getLocale } = useI18n()

const country = ref<CountryCode | undefined>(initialCountry())
const display = ref(model.value ? resolvePhoneInput(model.value).display : '')

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

function initialCountry(): CountryCode | undefined {
  if (model.value) return resolvePhoneInput(model.value).country
  const browserRegion = import.meta.client ? navigator.language.split('-')[1] : undefined
  return toPhoneCountry(props.defaultCountry) ?? toPhoneCountry(browserRegion)
}

function onInput(value: string | number) {
  const state = resolvePhoneInput(String(value ?? ''), country.value)
  display.value = state.display
  if (state.country) country.value = state.country
  model.value = state.e164
}

function onCountryChange(code: CountryCode) {
  country.value = code
  // A '+…' number already carries its own country; switching starts it over.
  onInput(isInternational.value ? '' : display.value)
}

// External resets (e.g. the booking state cleared) clear the field too.
watch(model, (value) => {
  if (!value && resolvePhoneInput(display.value, country.value).e164) {
    display.value = ''
  }
})
</script>

<template>
  <UFieldGroup size="xl" class="w-full">
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
      trailing-icon="i-lucide-chevron-down"
      :ui="{
        base: 'w-[68px] rounded-s-3xl ps-3.5 pe-7',
        content: 'w-72',
        trailingIcon: 'size-3.5',
        placeholder: 'hidden'
      }"
      @update:model-value="onCountryChange"
    >
      <span class="flex items-center text-xl leading-none">
        <template v-if="selectedCountry">{{ selectedCountry.flag }}</template>
        <UIcon v-else name="i-lucide-globe" class="size-5 text-muted" />
      </span>

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
      :color="invalid ? 'error' : 'primary'"
      :highlight="invalid"
      :aria-label="$ts('booking.steps.confirm.phone')"
      :aria-invalid="invalid"
      class="flex-1"
      :style="{ '--dial-code-length': `${(selectedCountry?.dial.length ?? 0) + 1.5}ch` }"
      :ui="{
        base:
          !isInternational && selectedCountry
            ? 'ps-(--dial-code-length) rounded-e-3xl'
            : 'rounded-e-3xl',
        leading: 'pointer-events-none text-base text-muted'
      }"
      @update:model-value="onInput"
      @keydown.enter.prevent="emit('submit')"
    >
      <template v-if="!isInternational && selectedCountry" #leading>
        {{ selectedCountry.dial }}
      </template>
      <template v-if="model" #trailing>
        <UIcon name="i-lucide-circle-check" class="size-5 text-success" />
      </template>
    </UInput>
  </UFieldGroup>
</template>
