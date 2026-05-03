<script setup lang="ts">
const { $ts } = useI18n()

const comparisonSection = ref<HTMLElement>()
const { isVisible: comparisonVisible } = useScrollReveal(comparisonSection)

const comparisonRows = computed(() => [
  { crm: $ts('comparison.rows.setup.crm'), seene: $ts('comparison.rows.setup.seene') },
  { crm: $ts('comparison.rows.payment.crm'), seene: $ts('comparison.rows.payment.seene') },
  { crm: $ts('comparison.rows.manager.crm'), seene: $ts('comparison.rows.manager.seene') },
  { crm: $ts('comparison.rows.interface.crm'), seene: $ts('comparison.rows.interface.seene') },
  { crm: $ts('comparison.rows.price.crm'), seene: $ts('comparison.rows.price.seene') }
])
</script>

<template>
  <section id="comparison" ref="comparisonSection" class="py-20 px-4 bg-[var(--section-bg-dark)]">
    <div class="max-w-4xl mx-auto">
      <h2
        class="text-2xl font-bold text-center text-white mb-12 transition-all duration-700"
        :class="comparisonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        {{ $ts('comparison.title') }}
      </h2>
      <div class="flex gap-4">
        <div class="flex-1 rounded-2xl overflow-hidden bg-white/[0.06] ring-1 ring-white/10">
          <div class="px-6 py-4 border-b border-white/10">
            <p class="text-sm font-semibold" style="color: rgba(235, 235, 235, 0.4)">
              {{ $ts('comparison.crmHeader') }}
            </p>
          </div>
          <div
            v-for="(row, i) in comparisonRows"
            :key="i"
            class="flex items-center gap-3 px-6 py-4 border-b border-white/10 last:border-0 transition-all"
            :class="comparisonVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'"
            :style="{ transitionDelay: `${i * 80}ms`, transitionDuration: '500ms' }"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4 flex-shrink-0" style="color: #f87171" />
            <span class="text-sm" style="color: rgba(235, 235, 235, 0.4)">{{ row.crm }}</span>
          </div>
        </div>
        <div class="flex-1 rounded-2xl overflow-hidden bg-amber-500/5 ring-1 ring-amber-500/30">
          <div class="px-6 py-4 border-b border-white/10">
            <p class="text-sm font-semibold text-white">Seene</p>
          </div>
          <div
            v-for="(row, i) in comparisonRows"
            :key="i"
            class="flex items-center gap-3 px-6 py-4 border-b border-white/10 last:border-0 transition-all"
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
</template>
