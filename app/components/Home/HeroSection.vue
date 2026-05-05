<script setup lang="ts">
const config = useRuntimeConfig()
const { $ts, $localePath } = useI18n()
</script>

<template>
  <section id="home" class="home-hero relative overflow-hidden" style="min-height: 600px">
    <div
      class="absolute pointer-events-none"
      style="
        left: 40%;
        top: -100px;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.14) 0%, transparent 65%);
        filter: blur(48px);
      "
    />
    <div
      class="absolute pointer-events-none"
      style="
        left: 36%;
        bottom: -80px;
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.09) 0%, transparent 65%);
        filter: blur(36px);
      "
    />

    <div
      class="relative z-10 max-w-6xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-14 lg:gap-20"
    >
      <div class="flex-1 flex flex-col items-start max-w-xl">
        <div
          class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm font-medium"
          style="
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.25);
          "
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
          {{ $ts('hero.badge') }}
        </div>

        <h1
          class="font-bold text-white leading-[1.15] tracking-tight mb-5"
          style="font-size: clamp(1.875rem, 3.5vw, 2.75rem)"
        >
          {{ $ts('hero.title') }}
        </h1>

        <p class="text-base leading-relaxed mb-8" style="color: rgba(235, 235, 235, 0.62)">
          {{ $ts('hero.description') }}
        </p>

        <div class="flex flex-wrap gap-3 mb-4">
          <UButton
            :to="config.public.dashboardUrl"
            :label="$ts('hero.cta')"
            color="primary"
            size="xl"
            class="rounded-3xl"
          />
          <UButton
            :to="$localePath('/for/nail-masters')"
            :label="$ts('hero.ctaSecondary')"
            variant="ghost"
            size="xl"
            class="rounded-3xl text-white! border border-white/20 hover:bg-white/10!"
          />
        </div>

        <p class="text-sm" style="color: rgba(235, 235, 235, 0.38)">{{ $ts('hero.microtext') }}</p>
      </div>

      <div class="flex-1 flex justify-center lg:justify-end">
        <div class="relative">
          <div
            class="absolute -top-4 left-6 z-10 bg-[var(--ui-bg-elevated)] text-[var(--ui-text-highlighted)] rounded-2xl shadow-xl shadow-black/10 ring-1 ring-[var(--ui-border-muted)] px-4 py-2 text-sm font-medium whitespace-nowrap dark:shadow-black/40"
          >
            seene.app/alina_nails
          </div>

          <img
            src="https://images.unsplash.com/photo-1457972729786-0411a3b2b626?auto=format&fit=crop&w=900&q=80"
            :alt="$ts('hero.imageAlt')"
            class="w-full rounded-3xl object-cover"
            style="
              max-width: 460px;
              box-shadow:
                0 0 70px rgba(245, 158, 11, 0.22),
                0 24px 64px rgba(0, 0, 0, 0.35);
            "
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  background: linear-gradient(108deg, #1c1c1c 0%, #252121 46%, #ede9e2 100%);
}

:global(.dark) .home-hero {
  background: linear-gradient(108deg, #09090b 0%, #18181b 54%, #2c2020 100%);
}
</style>
