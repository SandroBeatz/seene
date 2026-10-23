<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import {
  WAITLIST_CITIES,
  WAITLIST_CONTACT_MAX,
  WAITLIST_NAME_MAX,
  WAITLIST_SPECIALTIES,
  type WaitlistCity,
  type WaitlistSpecialty
} from '#shared/utils/waitlist'

/**
 * The founders application (POST /api/waitlist). After sending, the form is
 * replaced by "Thank you! We'll write within 2 days" with a check that draws
 * itself (animation spec). `website` is a trap field people never see.
 */
const { $ts, $localePath, getLocale } = useI18n()

const state = reactive({
  name: '',
  contact: '',
  city: 'bishkek' as WaitlistCity,
  specialties: ['manicure'] as WaitlistSpecialty[]
})
const website = ref('')
const shownAt = ref(0)
const sending = ref(false)
const sent = ref(false)
const failure = ref('')

onMounted(() => {
  shownAt.value = Date.now()
})

const cities = computed(() =>
  WAITLIST_CITIES.map((value) => ({ value, label: $ts(`founders.form.cities.${value}`) }))
)

function toggle(specialty: WaitlistSpecialty) {
  state.specialties = state.specialties.includes(specialty)
    ? state.specialties.filter((item) => item !== specialty)
    : [...state.specialties, specialty]
}

function validate(): FormError[] {
  const errors: FormError[] = []
  if (!state.name.trim()) errors.push({ name: 'name', message: $ts('founders.form.nameRequired') })
  if (state.contact.trim().length < 2) {
    errors.push({ name: 'contact', message: $ts('founders.form.contactRequired') })
  }
  if (!state.specialties.length) {
    errors.push({ name: 'specialties', message: $ts('founders.form.specialtyRequired') })
  }
  return errors
}

async function submit() {
  sending.value = true
  failure.value = ''
  try {
    await $fetch('/api/waitlist', {
      method: 'POST',
      body: {
        ...state,
        locale: getLocale(),
        website: website.value,
        shown_at: shownAt.value
      }
    })
    sent.value = true
  } catch (e: unknown) {
    const { statusCode } = e as { statusCode?: number }
    failure.value = $ts(statusCode === 429 ? 'founders.form.tooMany' : 'founders.form.failed')
  } finally {
    sending.value = false
  }
}

const fieldUi = {
  root: 'w-full',
  base: 'rounded-[14px] bg-white px-4 py-3.5 text-[16px] text-ink ring-[#D6D6D2] placeholder:text-dimmed'
}
const labelUi = {
  label: 'text-[13px] leading-[normal] font-semibold text-ink',
  error: 'text-[13px]'
}
</script>

<template>
  <div class="rounded-[28px] border border-line bg-paper p-6 sm:p-8">
    <div
      v-if="sent"
      class="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center"
      role="status"
    >
      <svg
        viewBox="0 0 48 48"
        class="size-14 text-ink"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="22" class="text-line" stroke="currentColor" />
        <path d="M15 24.5l6 6 12-13" class="site-draw" />
      </svg>
      <div class="text-[20px] font-semibold tracking-[-0.02em] text-ink">
        {{ $ts('founders.form.doneTitle') }}
      </div>
      <p class="m-0 text-[16px] text-ink-muted">{{ $ts('founders.form.doneText') }}</p>
    </div>

    <UForm
      v-else
      :state="state"
      :validate="validate"
      :validate-on="['blur']"
      class="relative flex flex-col gap-4.5"
      @submit="submit"
    >
      <div class="text-[20px] font-semibold tracking-[-0.02em] text-ink">
        {{ $ts('founders.form.title') }}
      </div>

      <UFormField name="name" :label="$ts('founders.form.name')" :ui="labelUi">
        <UInput
          v-model="state.name"
          :placeholder="$ts('founders.form.namePlaceholder')"
          :maxlength="WAITLIST_NAME_MAX"
          autocomplete="given-name"
          :ui="fieldUi"
        />
      </UFormField>

      <UFormField name="contact" :label="$ts('founders.form.contact')" :ui="labelUi">
        <UInput
          v-model="state.contact"
          :placeholder="$ts('founders.form.contactPlaceholder')"
          :maxlength="WAITLIST_CONTACT_MAX"
          autocomplete="off"
          :ui="fieldUi"
        />
      </UFormField>

      <UFormField name="city" :label="$ts('founders.form.city')" :ui="labelUi">
        <USelect
          v-model="state.city"
          :items="cities"
          class="w-full"
          :ui="{
            ...fieldUi,
            base: `${fieldUi.base} pe-10`,
            value: 'text-[16px] leading-[normal]',
            item: 'text-[16px] leading-[normal]',
            itemLabel: 'text-[16px]'
          }"
        />
      </UFormField>

      <div role="group" aria-labelledby="founders-specialty" class="flex flex-col gap-2">
        <div id="founders-specialty" class="text-[13px] font-semibold text-ink">
          {{ $ts('founders.form.specialty') }}
        </div>
        <UFormField name="specialties" :ui="labelUi">
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="specialty in WAITLIST_SPECIALTIES"
              :key="specialty"
              :ui="{ label: 'leading-[normal]' }"
              :label="$ts(`founders.form.specialties.${specialty}`)"
              :aria-pressed="state.specialties.includes(specialty)"
              :color="state.specialties.includes(specialty) ? 'primary' : 'neutral'"
              :variant="state.specialties.includes(specialty) ? 'solid' : 'outline'"
              class="leading-[normal] rounded-full px-4.5 py-2.5 text-[14px]"
              :class="
                state.specialties.includes(specialty)
                  ? 'font-semibold'
                  : 'bg-white font-medium text-ink ring-[#D6D6D2] hover:bg-white/70'
              "
              @click="toggle(specialty)"
            />
          </div>
        </UFormField>
      </div>

      <!-- Trap for bots: hidden from people and screen readers -->
      <input
        v-model="website"
        type="text"
        name="website"
        tabindex="-1"
        autocomplete="off"
        aria-hidden="true"
        class="absolute -left-[9999px] h-px w-px opacity-0"
      />

      <UButton
        :ui="{ label: 'leading-[normal]' }"
        type="submit"
        :label="$ts('founders.form.submit')"
        :loading="sending"
        color="primary"
        block
        class="leading-[normal] rounded-full p-4 text-[16px] font-semibold hover:bg-ink/85 active:scale-[0.98]"
      />

      <p v-if="failure" class="m-0 text-[14px] text-error" role="alert">{{ failure }}</p>

      <p class="m-0 text-[12px] leading-normal text-ink-muted">
        {{ $ts('founders.form.note') }}
        <NuxtLink :to="$localePath('/privacy')" class="underline hover:text-ink">
          {{ $ts('founders.form.privacy') }}</NuxtLink
        >.
      </p>
    </UForm>
  </div>
</template>
