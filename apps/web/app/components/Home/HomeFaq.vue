<script setup lang="ts">
/** "Вопросы": four short answers, all open (no accordion in the design). */
const questions = ['install', 'robot', 'price', 'data'] as const
</script>

<template>
  <section class="border-b border-line">
    <div class="site-container flex flex-wrap gap-14 py-24">
      <div v-reveal class="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
        <div class="site-eyebrow">{{ $ts('faq.eyebrow') }}</div>
        <h2 class="site-h2 text-ink">{{ $ts('faq.title') }}</h2>
      </div>
      <dl
        class="m-0 grid min-w-0 flex-[2_1_600px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-x-10"
      >
        <div
          v-for="(question, i) in questions"
          :key="question"
          v-reveal="i"
          class="flex flex-col gap-2 border-t border-line py-5.5"
        >
          <dt class="text-[17px] font-semibold text-ink">{{ $ts(`faq.${question}.q`) }}</dt>
          <dd class="m-0 text-[15px] leading-[1.55] text-ink-muted">
            {{ $ts(`faq.${question}.a`) }}
            <NuxtLink
              v-if="question === 'data'"
              :to="$localePath('/privacy')"
              class="text-ink underline hover:text-ink-muted"
            >
              {{ $ts('faq.data.more') }}
            </NuxtLink>
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>
