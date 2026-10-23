<script setup lang="ts">
/**
 * "Пора позвать": the app's recall list on a phone lying on the master's desk
 * (P-01, a top-down photo; a warm gradient until it exists), with three cards
 * telling the story: her cycle, her reply, the month's result.
 */
const points = ['p1', 'p2', 'p3'] as const
</script>

<template>
  <section class="border-b border-line bg-paper">
    <div class="site-container flex flex-wrap-reverse items-center gap-16 py-24">
      <div
        class="relative h-[760px] min-w-0 flex-[1_1_520px] overflow-hidden rounded-[32px] bg-linear-160 from-[#6E514B] via-[#A47D74] via-55% to-[#D7BFB6]"
      >
        <div class="absolute inset-0">
          <SiteImage
            id="P-01"
            name="p-01-recall"
            :alt="$ts('recall.imageAlt')"
            tint="transparent"
            id-at="top"
            sizes="(max-width: 767px) 100vw, 600px"
          />
        </div>

        <div
          class="absolute top-[50px] left-1/2 -translate-x-1/2 drop-shadow-[0_30px_50px_rgba(40,20,15,0.35)]"
        >
          <HomeRecallPhone />
        </div>

        <div
          class="site-float absolute top-[150px] left-5 flex w-[210px] flex-col gap-2.5 rounded-[18px] bg-white px-4 py-3.5 shadow-[0_18px_40px_rgba(40,20,15,0.22)]"
        >
          <div class="font-mono text-[10px] tracking-[0.08em] text-ink-muted uppercase">
            {{ $ts('recall.cycleLabel') }}
          </div>
          <div class="flex items-center gap-1" aria-hidden="true">
            <template v-for="n in 3" :key="n">
              <span class="size-2.5 rounded-full bg-ink" />
              <span v-if="n < 3" class="h-0.5 flex-1 bg-ink" />
            </template>
            <span
              class="h-0.5 flex-1 bg-[linear-gradient(90deg,var(--color-brand)_50%,transparent_50%)] bg-size-[8px_2px]"
            />
            <span
              class="size-3.5 rounded-full bg-brand shadow-[0_0_0_4px_var(--color-brand-soft)]"
            />
          </div>
          <p class="m-0 text-[13px] leading-[1.4] text-ink">
            {{ $ts('recall.cycleStart') }}
            <b class="font-semibold">{{ $ts('recall.cyclePassed') }}</b>
            {{ $ts('recall.cycleEnd') }}
          </p>
        </div>

        <div
          class="site-float absolute top-[330px] right-5 flex max-w-[220px] flex-col gap-1.5 rounded-[18px_18px_4px_18px] bg-wa-soft px-3.5 py-3 shadow-[0_18px_40px_rgba(40,20,15,0.22)] [animation-delay:-2s]"
        >
          <div class="flex items-center gap-1.5 text-[11px] font-semibold text-wa">
            <UIcon name="i-lucide-message-circle" class="size-3.5" />
            {{ $ts('recall.replyLabel') }}
          </div>
          <div class="text-sm leading-[1.4] text-ink">{{ $ts('recall.reply') }}</div>
        </div>

        <div
          class="site-float absolute bottom-9 left-7 flex flex-col gap-0.5 rounded-[18px] bg-ink px-4.5 py-3.5 text-white shadow-[0_18px_40px_rgba(40,20,15,0.3)] [animation-delay:-4s]"
        >
          <div class="text-xs text-[#A6A6AD]">{{ $ts('recall.returnedLabel') }}</div>
          <div class="font-display text-2xl font-semibold tracking-[-0.02em]">
            {{ $ts('recall.returned') }}
          </div>
        </div>
      </div>

      <div v-reveal class="flex min-w-0 flex-[1_1_460px] flex-col gap-6">
        <div class="site-eyebrow">{{ $ts('recall.eyebrow') }}</div>
        <h2 class="site-h2 text-ink">{{ $ts('recall.title') }}</h2>
        <p class="m-0 text-[17px] leading-relaxed text-ink-muted">
          {{ $ts('recall.description') }}
        </p>
        <ul class="m-0 flex list-none flex-col gap-3.5 p-0 text-base text-ink">
          <li v-for="point in points" :key="point" class="flex items-start gap-3">
            <UIcon name="i-lucide-check" class="mt-0.5 size-5 shrink-0" />
            {{ $ts(`recall.${point}`) }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
