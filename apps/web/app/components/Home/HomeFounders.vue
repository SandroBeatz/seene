<script setup lang="ts">
/** "Мастера-основатели" (#join): what founders get, and the application form. */
const perks = ['perk1', 'perk2', 'perk3'] as const
</script>

<template>
  <section id="join" class="scroll-mt-(--ui-header-height) border-b border-line">
    <div class="site-container flex flex-wrap gap-14 py-24">
      <div v-reveal class="flex min-w-0 flex-[1_1_460px] flex-col gap-6">
        <div class="site-eyebrow">{{ $ts('founders.eyebrow') }}</div>
        <h2 class="site-h2 text-ink">{{ $ts('founders.title') }}</h2>
        <p class="m-0 text-[17px] leading-relaxed text-ink-muted">{{ $ts('founders.text') }}</p>
        <ol class="m-0 flex list-none flex-col border-t border-line p-0">
          <li
            v-for="(perk, i) in perks"
            :key="perk"
            class="flex gap-4 border-b border-line py-4.5 text-base text-ink"
          >
            <span class="w-7 shrink-0 font-mono text-[13px] leading-6 text-ink-muted">
              0{{ i + 1 }}
            </span>
            <span>
              <b class="font-semibold">{{ $ts(`founders.${perk}.bold`) }}</b
              >{{ $ts(`founders.${perk}.rest`) }}
            </span>
          </li>
        </ol>
      </div>

      <HomeFoundersForm v-reveal="1" class="min-w-0 flex-[1_1_420px]" />
    </div>
  </section>
</template>
