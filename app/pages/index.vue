<script setup lang="ts">
const cards = ref([
  {
    title: 'Nail-мастера',
    icon: 'i-lucide-smile',
    to: '/docs/getting-started/integrations/icons'
  },
  {
    title: 'Бровисты',
    icon: 'i-lucide-a-large-small',
    to: '/docs/getting-started/integrations/fonts'
  },
  {
    title: 'Лэшмейкеры',
    icon: 'i-lucide-sun-moon',
    to: '/docs/getting-started/integrations/color-mode'
  },
  {
    title: 'Визажисты',
    icon: 'i-lucide-sun-moon',
    to: '/docs/getting-started/integrations/color-mode'
  }
])
</script>

<template>
  <div>
    <UPageHero
      :ui="{ root: 'bg-primary/20' }"
      title="«Твоя онлайн-запись за 5 минут» или «Больше клиентов — меньше переписки»"
      description="Создай личную страницу, добавь в Instagram и принимай записи автоматически"
      :links="[
        {
          label: 'Начать бесплатно',
          to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
          target: '_blank',
          trailingIcon: 'i-lucide-arrow-right',
          size: 'xl'
        }
      ]"
    />

    <UPageSection
      id="features"
      title="Для мастеров beauty-индустрии"
      orientation="horizontal"
      reverse
    >
      <img
        src="https://picsum.photos/704/1294"
        width="352"
        height="647"
        alt="Illustration"
        class="w-full rounded-lg"
        loading="lazy"
      />
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
        title="Ready to build your next Nuxt app?"
        description="Join thousands of developers building with Nuxt and Nuxt UI. Get this template and start shipping today."
        variant="subtle"
        :links="[
          {
            label: 'Start building',
            to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
            target: '_blank',
            trailingIcon: 'i-lucide-arrow-right',
            color: 'neutral'
          },
          {
            label: 'View on GitHub',
            to: 'https://github.com/nuxt-ui-templates/starter',
            target: '_blank',
            icon: 'i-simple-icons-github',
            color: 'neutral',
            variant: 'outline'
          }
        ]"
      />
    </UPageSection>
  </div>
</template>
