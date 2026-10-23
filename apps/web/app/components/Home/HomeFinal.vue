<script setup lang="ts">
/**
 * Final call to download. Until the app is in the stores (no store links in
 * the runtime config), both buttons lead to the founders form.
 */
const config = useRuntimeConfig()
const { $ts, $localePath } = useI18n()

const join = computed(() => `${$localePath('/')}#join`)
const stores = computed(() => [
  { key: 'appStore', to: config.public.appStoreUrl || join.value },
  { key: 'googlePlay', to: config.public.googlePlayUrl || join.value }
])
</script>

<template>
  <section class="border-b border-line">
    <div class="site-container flex flex-col items-center gap-7 py-30 text-center">
      <SeeneMark class="w-16 text-ink" />
      <h2
        v-reveal
        class="m-0 max-w-[900px] font-display text-[clamp(34px,4vw,56px)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-ink"
      >
        {{ $ts('final.title') }}
      </h2>
      <div class="flex flex-wrap justify-center gap-3">
        <UButton
          v-for="store in stores"
          :key="store.key"
          :to="store.to"
          :target="store.to.startsWith('http') ? '_blank' : undefined"
          color="primary"
          leading-icon="i-lucide-download"
          class="gap-2.5 rounded-[14px] px-5.5 py-3.5 text-left hover:bg-ink/85 active:scale-[0.98]"
          :ui="{ leadingIcon: 'size-5.5' }"
        >
          <span class="flex flex-col">
            <span class="text-[11px] font-normal text-[#B8B8BE]">{{
              $ts('final.storePrefix')
            }}</span>
            <span class="text-base font-semibold">{{ $ts(`final.${store.key}`) }}</span>
          </span>
        </UButton>
      </div>
      <p class="m-0 text-sm text-ink-muted">{{ $ts('final.note') }}</p>
    </div>
  </section>
</template>
