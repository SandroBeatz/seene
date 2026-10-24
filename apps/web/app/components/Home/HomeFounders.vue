<script setup lang="ts">
/**
 * "Мастера-основатели" (#join): where we launch (by the visitor's country),
 * the notebook picture (B-01), what founders get, and the application form.
 */
const { market } = useMarket()
const perks = ['perk1', 'perk2', 'perk3'] as const
</script>

<template>
  <section id="join" class="scroll-mt-(--ui-header-height) border-b border-line">
    <div class="site-container flex flex-wrap gap-14 py-24">
      <div v-reveal class="flex min-w-0 flex-[1_1_460px] flex-col gap-6">
        <div class="site-eyebrow">{{ $ts('founders.eyebrow') }}</div>
        <h2 class="site-h2 text-ink">{{ $ts('founders.title') }}</h2>
        <p class="m-0 text-[17px] leading-[1.6] text-ink-muted">
          {{ $ts(`founders.launch.${market}`) }} {{ $ts('founders.text') }}
        </p>
        <div class="aspect-[4/5] overflow-hidden rounded-[28px] md:aspect-[3/2]">
          <SiteImage
            id="B-01"
            name="b-01-founders"
            :alt="$ts('founders.imageAlt')"
            sizes="(max-width: 767px) 100vw, 600px"
          />
        </div>
        <ol class="m-0 flex list-none flex-col border-t border-line p-0">
          <li
            v-for="(perk, i) in perks"
            :key="perk"
            class="flex items-center gap-4 border-b border-line py-4.5 text-[16px] text-ink"
          >
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white"
            >
              {{ i + 1 }}
            </span>
            <span>
              <b class="font-bold">{{ $ts(`founders.${perk}.bold`) }}</b
              >{{ $ts(`founders.${perk}.rest`) }}
            </span>
          </li>
        </ol>
      </div>

      <HomeFoundersForm v-reveal="1" class="min-w-0 flex-[1_1_420px]" />
    </div>
  </section>
</template>
