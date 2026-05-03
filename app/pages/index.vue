<script setup lang="ts">
const { $ts, $localePath } = useI18n()

// ── Scroll reveal refs ────────────────────────────────────────────
const audienceSection = ref<HTMLElement>()
const painSection = ref<HTMLElement>()
const stepsSection = ref<HTMLElement>()
const featuresSection = ref<HTMLElement>()
const personalSection = ref<HTMLElement>()
const comparisonSection = ref<HTMLElement>()
const pricingSection = ref<HTMLElement>()
const faqSection = ref<HTMLElement>()
const ctaSection = ref<HTMLElement>()

const { isVisible: audienceVisible } = useScrollReveal(audienceSection)
const { isVisible: painVisible } = useScrollReveal(painSection)
const { isVisible: stepsVisible } = useScrollReveal(stepsSection)
const { isVisible: featuresVisible } = useScrollReveal(featuresSection)
const { isVisible: personalVisible } = useScrollReveal(personalSection)
const { isVisible: comparisonVisible } = useScrollReveal(comparisonSection)
const { isVisible: pricingVisible } = useScrollReveal(pricingSection)
const { isVisible: faqVisible } = useScrollReveal(faqSection)
const { isVisible: ctaVisible } = useScrollReveal(ctaSection)


// ── Audience ──────────────────────────────────────────────────────
const audienceCards = computed(() => [
  { title: $ts('audience.cards.nails.title'), description: $ts('audience.cards.nails.description'), icon: 'i-lucide-hand' },
  { title: $ts('audience.cards.brows.title'), description: $ts('audience.cards.brows.description'), icon: 'i-lucide-eye' },
  { title: $ts('audience.cards.makeup.title'), description: $ts('audience.cards.makeup.description'), icon: 'i-lucide-sparkles' },
  { title: $ts('audience.cards.pmu.title'), description: $ts('audience.cards.pmu.description'), icon: 'i-lucide-pen-line' }
])

// ── How it works ──────────────────────────────────────────────────
const howSteps = computed(() => [
  { num: 1, title: $ts('steps.step1.title'), description: $ts('steps.step1.description') },
  { num: 2, title: $ts('steps.step2.title'), description: $ts('steps.step2.description') },
  { num: 3, title: $ts('steps.step3.title'), description: $ts('steps.step3.description') },
  { num: 4, title: $ts('steps.step4.title'), description: $ts('steps.step4.description') }
])

// ── Features ──────────────────────────────────────────────────────
const featureCards = computed(() => [
  { title: $ts('features.booking.title'), description: $ts('features.booking.description'), icon: 'i-lucide-calendar-check', color: '#f87171', featured: false },
  { title: $ts('features.calendar.title'), description: $ts('features.calendar.description'), icon: 'i-lucide-calendar', color: '#60a5fa', featured: false },
  { title: $ts('features.services.title'), description: $ts('features.services.description'), icon: 'i-lucide-scissors', color: '#4ade80', featured: false },
  { title: $ts('features.clients.title'), description: $ts('features.clients.description'), icon: 'i-lucide-users', color: '#a78bfa', featured: false },
  { title: $ts('features.reminders.title'), description: $ts('features.reminders.description'), icon: 'i-lucide-bell', color: '#f59e0b', featured: true },
  { title: $ts('features.stats.title'), description: $ts('features.stats.description'), icon: 'i-lucide-bar-chart-2', color: '#fb923c', featured: false }
])

// ── Personal page ─────────────────────────────────────────────────
const personalFeatures = computed(() => [
  $ts('personalPage.features.avatar'),
  $ts('personalPage.features.services'),
  $ts('personalPage.features.booking'),
  $ts('personalPage.features.contacts')
])

// ── Comparison ────────────────────────────────────────────────────
const comparisonRows = computed(() => [
  { crm: $ts('comparison.rows.setup.crm'), seene: $ts('comparison.rows.setup.seene') },
  { crm: $ts('comparison.rows.payment.crm'), seene: $ts('comparison.rows.payment.seene') },
  { crm: $ts('comparison.rows.manager.crm'), seene: $ts('comparison.rows.manager.seene') },
  { crm: $ts('comparison.rows.interface.crm'), seene: $ts('comparison.rows.interface.seene') },
  { crm: $ts('comparison.rows.price.crm'), seene: $ts('comparison.rows.price.seene') }
])

// ── Pricing ───────────────────────────────────────────────────────
const freeFeatures = computed(() => [
  $ts('pricing.free.feature1'),
  $ts('pricing.free.feature2'),
  $ts('pricing.free.feature3'),
  $ts('pricing.free.feature4')
])

const proFeatures = computed(() => [
  $ts('pricing.pro.feature1'),
  $ts('pricing.pro.feature2'),
  $ts('pricing.pro.feature3'),
  $ts('pricing.pro.feature4'),
  $ts('pricing.pro.feature5'),
  $ts('pricing.pro.feature6')
])

// ── FAQ ───────────────────────────────────────────────────────────
const faqItems = computed(() => [
  { label: $ts('faq.q1.question'), content: $ts('faq.q1.answer') },
  { label: $ts('faq.q2.question'), content: $ts('faq.q2.answer') },
  { label: $ts('faq.q3.question'), content: $ts('faq.q3.answer') },
  { label: $ts('faq.q4.question'), content: $ts('faq.q4.answer') },
  { label: $ts('faq.q5.question'), content: $ts('faq.q5.answer') }
])

// Phone mockup services (illustration only — ru text is intentional)
const mockupServices = [
  ['Маникюр', '1 500 ₽', '60 мин'],
  ['Покрытие гель-лак', '2 000 ₽', '90 мин'],
  ['Педикюр', '2 200 ₽', '75 мин']
]

// Pain bubbles (illustration only — ru text is intentional)
const painBubbles = ['Айнура: во сколько завтра?', 'Новое сообщение в Direct', 'Не забудь про запись в 14:00']
</script>

<template>
  <div>
    <!-- ── Section 1: Hero ─────────────────────────────────────── -->
    <section
      class="relative overflow-hidden"
      style="background: linear-gradient(108deg, #1c1c1c 0%, #252121 46%, #ede9e2 100%); min-height: 600px"
    >
      <!-- Amber glow blobs at gradient boundary -->
      <div
        class="absolute pointer-events-none"
        style="left: 40%; top: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(245,158,11,0.14) 0%, transparent 65%); filter: blur(48px)"
      />
      <div
        class="absolute pointer-events-none"
        style="left: 36%; bottom: -80px; width: 320px; height: 320px; background: radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 65%); filter: blur(36px)"
      />

      <div class="relative z-10 max-w-6xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
        <!-- Left: text -->
        <div class="flex-1 flex flex-col items-start max-w-xl">
          <!-- Badge -->
          <div
            class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm font-medium"
            style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25)"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
            {{ $ts('hero.badge') }}
          </div>

          <!-- Title -->
          <h1
            class="font-bold text-white leading-[1.15] tracking-tight mb-5"
            style="font-size: clamp(1.875rem, 3.5vw, 2.75rem)"
          >
            {{ $ts('hero.title') }}
          </h1>

          <!-- Description -->
          <p class="text-base leading-relaxed mb-8" style="color: rgba(235,235,235,0.62)">
            {{ $ts('hero.description') }}
          </p>

          <!-- CTAs -->
          <div class="flex flex-wrap gap-3 mb-4">
            <UButton
              :to="$localePath('/signup')"
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

          <p class="text-sm" style="color: rgba(235,235,235,0.38)">{{ $ts('hero.microtext') }}</p>
        </div>

        <!-- Right: image with floating pill -->
        <div class="flex-1 flex justify-center lg:justify-end">
          <div class="relative">
            <!-- Floating URL pill -->
            <div
              class="absolute -top-4 left-6 z-10 bg-white rounded-2xl shadow-xl px-4 py-2 text-sm font-medium whitespace-nowrap"
              style="color: #2c3e50; box-shadow: 0 8px 24px rgba(0,0,0,0.12)"
            >
              seene.app/alina_nails
            </div>

            <img
              src="https://images.unsplash.com/photo-1457972729786-0411a3b2b626?auto=format&fit=crop&w=900&q=80"
              :alt="$ts('hero.imageAlt')"
              class="w-full rounded-3xl object-cover"
              style="max-width: 460px; box-shadow: 0 0 70px rgba(245,158,11,0.22), 0 24px 64px rgba(0,0,0,0.35)"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ── Section 2: Для кого ────────────────────────────────── -->
    <section ref="audienceSection" class="py-20 px-4" style="background: #ffffff">
      <div class="max-w-5xl mx-auto">
        <h2
          class="text-2xl font-bold text-center mb-12 transition-all duration-700"
          :class="audienceVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          style="color: #2c3e50"
        >
          {{ $ts('audience.title') }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            v-for="(card, i) in audienceCards"
            :key="i"
            class="audience-card rounded-3xl shadow-lg bg-white transition-all"
            :class="audienceVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
            :style="{ padding: '28px', transitionDelay: `${i * 100}ms`, transitionDuration: '600ms' }"
          >
            <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style="background: rgba(245,158,11,0.12)">
              <UIcon :name="card.icon" class="w-5 h-5 text-amber-500" />
            </div>
            <h3 class="text-base font-semibold mb-2" style="color: #2c3e50">{{ card.title }}</h3>
            <p class="text-sm text-zinc-500">{{ card.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Section 3: Главная боль ────────────────────────────── -->
    <section ref="painSection" class="py-20 px-4" style="background: #181818">
      <div class="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <!-- Left: text -->
        <div
          class="flex-1 transition-all duration-700"
          :class="painVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
        >
          <h2 class="font-bold text-white mb-4" style="font-size: 2rem; line-height: 1.25">
            {{ $ts('pain.title') }}
          </h2>
          <p class="text-base leading-relaxed" style="color: rgba(235,235,235,0.64)">
            {{ $ts('pain.description') }}
          </p>
        </div>
        <!-- Right: animated bubbles -->
        <div class="flex-1 flex flex-col gap-3 w-full max-w-sm">
          <div
            v-for="(bubble, i) in painBubbles"
            :key="i"
            class="rounded-2xl transition-all"
            :class="painVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
            :style="{
              background: 'rgba(39,39,42,0.8)',
              padding: '12px 16px',
              color: 'rgba(235,235,235,0.8)',
              transitionDelay: `${i * 300}ms`,
              transitionDuration: '500ms'
            }"
          >
            {{ bubble }}
          </div>
        </div>
      </div>
    </section>

    <!-- ── Section 4: Как это работает ───────────────────────── -->
    <section ref="stepsSection" class="py-20 px-4" style="background: #f4f1ec">
      <div class="max-w-5xl mx-auto">
        <h2
          class="text-2xl font-bold text-center mb-14 transition-all duration-700"
          :class="stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          style="color: #2c3e50"
        >
          {{ $ts('steps.title') }}
        </h2>
        <div class="flex flex-col lg:flex-row gap-8">
          <div
            v-for="(step, i) in howSteps"
            :key="i"
            class="flex-1 flex flex-col items-center text-center transition-all"
            :class="stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
            :style="{ transitionDelay: `${i * 150}ms`, transitionDuration: '600ms' }"
          >
            <div class="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-lg mb-4 z-10">
              {{ step.num }}
            </div>
            <h3 class="text-base font-semibold mb-2" style="color: #2c3e50">{{ step.title }}</h3>
            <p class="text-sm text-zinc-500">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Section 5: Основные функции ───────────────────────── -->
    <section ref="featuresSection" class="py-20 px-4" style="background: #ffffff">
      <div class="max-w-5xl mx-auto">
        <h2
          class="text-2xl font-bold text-center mb-12 transition-all duration-700"
          :class="featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          style="color: #2c3e50"
        >
          {{ $ts('features.title') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(card, i) in featureCards"
            :key="i"
            class="rounded-3xl shadow-lg bg-white transition-all"
            :class="[featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6', card.featured ? 'border border-amber-500/30' : '']"
            :style="{ padding: '32px', transitionDelay: `${i * 100}ms`, transitionDuration: '600ms' }"
          >
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              :style="{ background: card.color + '1a' }"
            >
              <UIcon :name="card.icon" class="w-6 h-6" :style="{ color: card.color }" />
            </div>
            <h3 class="text-base font-semibold mb-2" style="color: #2c3e50">{{ card.title }}</h3>
            <p class="text-sm text-zinc-500">{{ card.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Section 6: Страница мастера ───────────────────────── -->
    <section ref="personalSection" class="py-20 px-4" style="background: #f4f1ec">
      <div class="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <!-- Left: text -->
        <div
          class="flex-1 transition-all duration-700"
          :class="personalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
        >
          <h2 class="text-2xl font-bold mb-4" style="color: #2c3e50">{{ $ts('personalPage.title') }}</h2>
          <p class="text-base text-zinc-500 leading-relaxed mb-6">{{ $ts('personalPage.description') }}</p>
          <ul class="space-y-4">
            <li v-for="(feat, i) in personalFeatures" :key="i" class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
              <span class="text-sm" style="color: #2c3e50">{{ feat }}</span>
            </li>
          </ul>
        </div>
        <!-- Right: phone mockup -->
        <div
          class="flex-1 flex justify-center transition-all duration-700"
          :class="personalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          style="transition-delay: 150ms"
        >
          <div class="relative mx-auto" style="width: 280px">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-4 py-2 text-sm font-medium whitespace-nowrap z-10" style="color: #2c3e50">
              seene.app/alina_nails
            </div>
            <div class="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
              <div class="bg-white rounded-[2rem] overflow-hidden flex flex-col items-center pt-8 pb-6 px-4" style="height: 560px">
                <div class="w-20 h-20 rounded-full bg-amber-100 mb-3 flex-shrink-0" />
                <p class="font-semibold text-base mb-1" style="color: #2c3e50">Алина</p>
                <p class="text-xs text-zinc-500 mb-5">nail-мастер</p>
                <div class="w-full space-y-2 mb-5">
                  <div
                    v-for="svc in mockupServices"
                    :key="svc[0]"
                    class="flex justify-between items-center rounded-2xl px-3 py-2"
                    style="background: #f4f1ec"
                  >
                    <span class="text-xs font-medium" style="color: #2c3e50">{{ svc[0] }}</span>
                    <div class="text-right">
                      <p class="text-xs font-semibold text-amber-500">{{ svc[1] }}</p>
                      <p class="text-xs text-zinc-400">{{ svc[2] }}</p>
                    </div>
                  </div>
                </div>
                <UButton
                  color="primary"
                  size="sm"
                  class="w-full rounded-2xl"
                  :label="$ts('personalPage.mockupCta')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Section 7: Сравнение с CRM ────────────────────────── -->
    <section ref="comparisonSection" class="py-20 px-4" style="background: #181818">
      <div class="max-w-4xl mx-auto">
        <h2
          class="text-2xl font-bold text-center text-white mb-12 transition-all duration-700"
          :class="comparisonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        >
          {{ $ts('comparison.title') }}
        </h2>
        <div class="flex gap-4">
          <!-- CRM column -->
          <div class="flex-1 rounded-2xl overflow-hidden" style="background: rgba(63,63,70,0.5)">
            <div class="px-6 py-4 border-b border-zinc-700">
              <p class="text-sm font-semibold" style="color: rgba(235,235,235,0.4)">{{ $ts('comparison.crmHeader') }}</p>
            </div>
            <div
              v-for="(row, i) in comparisonRows"
              :key="i"
              class="flex items-center gap-3 px-6 py-4 border-b border-zinc-700 last:border-0 transition-all"
              :class="comparisonVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'"
              :style="{ transitionDelay: `${i * 80}ms`, transitionDuration: '500ms' }"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4 flex-shrink-0" style="color: #f87171" />
              <span class="text-sm" style="color: rgba(235,235,235,0.4)">{{ row.crm }}</span>
            </div>
          </div>
          <!-- Seene column -->
          <div class="flex-1 rounded-2xl overflow-hidden" style="border: 1px solid rgba(245,158,11,0.3); background: rgba(245,158,11,0.05)">
            <div class="px-6 py-4 border-b border-zinc-700">
              <p class="text-sm font-semibold text-white">Seene</p>
            </div>
            <div
              v-for="(row, i) in comparisonRows"
              :key="i"
              class="flex items-center gap-3 px-6 py-4 border-b border-zinc-700 last:border-0 transition-all"
              :class="comparisonVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'"
              :style="{ transitionDelay: `${i * 80}ms`, transitionDuration: '500ms' }"
            >
              <UIcon name="i-lucide-check" class="w-4 h-4 flex-shrink-0" style="color: #4ade80" />
              <span class="text-sm text-white">{{ row.seene }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Section 8: Тарифы ──────────────────────────────────── -->
    <section ref="pricingSection" class="py-20 px-4" style="background: #f4f1ec">
      <div class="max-w-2xl mx-auto">
        <h2
          class="text-2xl font-bold text-center mb-12 transition-all duration-700"
          :class="pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          style="color: #2c3e50"
        >
          {{ $ts('pricing.title') }}
        </h2>
        <div class="flex flex-col sm:flex-row gap-6">
          <!-- Free -->
          <div
            class="flex-1 rounded-3xl bg-white shadow-md transition-all duration-700"
            :class="pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
            style="padding: 32px"
          >
            <p class="text-base font-semibold mb-1 text-zinc-500">{{ $ts('pricing.free.name') }}</p>
            <p class="text-3xl font-bold mb-6" style="color: #2c3e50">{{ $ts('pricing.free.price') }}</p>
            <ul class="space-y-3 mb-8">
              <li v-for="(feat, i) in freeFeatures" :key="i" class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span class="text-sm" style="color: #2c3e50">{{ feat }}</span>
              </li>
            </ul>
            <UButton
              :to="$localePath('/signup')"
              :label="$ts('pricing.free.cta')"
              color="neutral"
              variant="outline"
              block
              class="rounded-3xl"
            />
          </div>
          <!-- Pro -->
          <div
            class="flex-1 rounded-3xl bg-white shadow-xl relative transition-all duration-700"
            :class="pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
            style="padding: 32px; border: 1px solid rgba(245,158,11,0.4); transition-delay: 150ms"
          >
            <div class="absolute top-4 right-4 bg-amber-500 text-white rounded-full text-xs font-medium px-3 py-1">
              {{ $ts('pricing.pro.badge') }}
            </div>
            <p class="text-base font-semibold mb-1 text-zinc-500">{{ $ts('pricing.pro.name') }}</p>
            <div class="flex items-baseline gap-1 mb-6">
              <span class="text-3xl font-bold" style="color: #2c3e50">{{ $ts('pricing.pro.price') }}</span>
              <span class="text-sm text-zinc-500">{{ $ts('pricing.pro.period') }}</span>
            </div>
            <ul class="space-y-3 mb-8">
              <li v-for="(feat, i) in proFeatures" :key="i" class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span class="text-sm" style="color: #2c3e50">{{ feat }}</span>
              </li>
            </ul>
            <UButton
              :to="$localePath('/signup')"
              :label="$ts('pricing.pro.cta')"
              color="primary"
              block
              class="rounded-3xl"
            />
          </div>
        </div>
        <p class="text-center text-sm text-zinc-500 mt-6 flex items-center justify-center gap-2">
          <UIcon name="i-lucide-lock" class="w-4 h-4" />
          {{ $ts('pricing.notice') }}
        </p>
      </div>
    </section>

    <!-- ── Section 9: FAQ ─────────────────────────────────────── -->
    <section ref="faqSection" class="py-20 px-4" style="background: #ffffff">
      <div class="max-w-2xl mx-auto">
        <h2
          class="text-2xl font-bold text-center mb-10 transition-all duration-700"
          :class="faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          style="color: #2c3e50"
        >
          {{ $ts('faq.title') }}
        </h2>
        <div
          class="transition-all duration-700"
          :class="faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          style="transition-delay: 100ms"
        >
          <UAccordion :items="faqItems" />
        </div>
      </div>
    </section>

    <!-- ── Section 10: Финальный CTA ──────────────────────────── -->
    <section ref="ctaSection" class="py-24 px-4 bg-amber-500">
      <div
        class="max-w-3xl mx-auto text-center transition-all duration-700"
        :class="ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <h2 class="font-bold text-white mb-8" style="font-size: 2.2rem; line-height: 1.2">
          {{ $ts('finalCta.title') }}
        </h2>
        <UButton
          :to="$localePath('/signup')"
          :label="$ts('finalCta.button')"
          size="xl"
          class="rounded-3xl mb-4"
          :ui="{ base: 'bg-white! text-[#2c3e50]! hover:bg-white/90!' }"
        />
        <p class="text-sm" style="color: rgba(255,255,255,0.7)">{{ $ts('finalCta.microtext') }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.audience-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}
</style>
