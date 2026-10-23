<template>
  <section class="bg-ink text-white">
    <div class="site-container flex flex-wrap items-center justify-between gap-14 py-24">
      <div v-reveal class="flex min-w-0 flex-[1_1_520px] flex-col gap-5">
        <h2
          class="m-0 font-display text-[clamp(34px,4vw,56px)] leading-[1.05] font-semibold tracking-[-0.03em]"
        >
          {{ $ts('commission.title') }}<br />{{ $ts('commission.titleEnd') }}
        </h2>
        <p class="m-0 max-w-[520px] text-[17px] leading-relaxed text-[#B8B8BE]">
          {{ $ts('commission.text') }}
        </p>
        <UButton
          :to="$localePath('/pricing')"
          :label="$ts('commission.cta')"
          color="neutral"
          variant="outline"
          class="self-start rounded-full bg-transparent px-5.5 py-3.5 text-[15px] font-semibold text-white ring-[#3A3A40] hover:bg-white/10 active:scale-[0.98]"
        />
      </div>

      <div
        v-reveal="1"
        class="flex min-w-0 flex-[1_1_380px] flex-col overflow-hidden rounded-3xl border border-[#2A2A2F]"
      >
        <div class="flex items-center justify-between border-b border-[#2A2A2F] px-7 py-6">
          <div class="text-base font-semibold">{{ $ts('commission.seene') }}</div>
          <div class="font-display text-[32px] font-semibold">0%</div>
        </div>
        <div class="flex items-center justify-between gap-4 px-7 py-6 text-[#B8B8BE]">
          <div class="text-base">{{ $ts('commission.marketplaces') }}</div>
          <div class="font-display text-[32px] font-semibold whitespace-nowrap">20–30%</div>
        </div>
      </div>
    </div>
  </section>
</template>
