<script setup lang="ts">
const cards = ref([
  {
    title: 'Nail-мастера',
    description: 'Онлайн-запись для nail-мастеров',
    icon: 'i-lucide-hand',
    to: '/for/nail-masters'
  },
  {
    title: 'Бровисты',
    description: 'Онлайн-запись для бровистов',
    icon: 'i-lucide-eye',
    to: '/for/brow-artists'
  },
  {
    title: 'Лэшмейкеры',
    description: 'Онлайн-запись для лэшмейкеров',
    icon: 'i-lucide-eye',
    to: '/for/lash-makers'
  },
  {
    title: 'Визажисты',
    description: 'Онлайн-запись для визажистов',
    icon: 'i-lucide-sparkles',
    to: '/for/makeup-artists'
  },
  {
    title: 'PMU-мастера',
    description: 'Онлайн-запись для PMU-мастеров',
    icon: 'i-lucide-pen-line',
    to: '/for/pmu-masters'
  }
])
</script>

<template>
  <div>
    <UPageHero
      title="Больше клиентов — меньше переписки"
      description="Создай личную страницу, добавь в Instagram и принимай записи автоматически"
      orientation="horizontal"
      :links="[
        {
          label: 'Начать бесплатно',
          to: '/signup',
          color: 'primary',
          size: 'xl'
        }
      ]"
    >
      <img
        src="~/assets/img/hero.png"
        alt="Дашборд Seene — онлайн-запись для beauty-мастеров"
        class="w-full max-w-lg rounded-2xl shadow-xl"
      />
    </UPageHero>

    <UPageSection
      id="features"
      title="Для мастеров beauty-индустрии"
    >
      <UPageGrid>
        <UPageCard v-for="(card, index) in cards" :key="index" v-bind="card" />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      id="steps"
      title="3 шага до первого клиента"
      :features="[
        {
          icon: 'i-lucide-rocket',
          title: 'Регистрируешься'
        },
        {
          icon: 'i-lucide-rocket',
          title: 'Настраиваешь страницу'
        },
        {
          icon: 'i-lucide-rocket',
          title: 'Добавляешь ссылку в Instagram'
        }
      ]"
    />

    <UPageSection>
      <UPageCTA
        title="Начать бесплатно сегодня"
        description="Присоединяйся к мастерам, которые уже принимают записи через Seene — без переписки и пропущенных клиентов."
        variant="subtle"
        :links="[
          {
            label: 'Начать бесплатно',
            to: '/signup',
            trailingIcon: 'i-lucide-arrow-right',
            color: 'primary',
            size: 'xl'
          }
        ]"
      />
    </UPageSection>
  </div>
</template>
