<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'master' })

const { $ts } = useI18n()
const { setTheme } = useMasterTheme()

// Mock master data — will come from API based on route params in the future
const master = {
  username: 'anna_nails',
  name: 'Анна Соколова',
  specialty: 'Мастер ногтевого сервиса',
  avatar: 'https://i.pravatar.cc/200?img=47',
  bio: 'Профессиональный мастер маникюра и педикюра с 7-летним опытом. Работаю в Москве, делаю красивые и долговечные ногти. Использую только проверенные материалы от ведущих брендов.',
  location: 'Москва, м. Арбатская',
  experience: '7 лет',
  whatsapp: '79991234567',
  telegram: 'anna_nails',
  instagram: 'anna_nails',
  theme: {
    primary: 'pink',
    neutral: 'slate',
    radius: '0.75rem'
  }
}

setTheme(master.theme)

const tabs = computed<TabsItem[]>(() => [
  { label: $ts('master.tabs.home'), slot: 'home', value: 'home' },
  { label: $ts('master.tabs.services'), slot: 'services', value: 'services' },
  { label: $ts('master.tabs.portfolio'), slot: 'portfolio', value: 'portfolio' },
  { label: $ts('master.tabs.about'), slot: 'about', value: 'about' }
])
</script>

<template>
  <div class="max-w-lg mx-auto min-h-screen">
    <MasterProfileHeader
      :name="master.name"
      :specialty="master.specialty"
      :avatar="master.avatar"
    />

    <UTabs
      :items="tabs"
      default-value="home"
      variant="link"
      color="primary"
      class="w-full"
      :ui="{ list: 'border-b border-(--ui-border)', content: 'pt-4 px-4 pb-8' }"
    >
      <template #home>
        <MasterTabHome
          :username="master.username"
          :whatsapp="master.whatsapp"
          :telegram="master.telegram"
        />
      </template>

      <template #services>
        <MasterTabServices />
      </template>

      <template #portfolio>
        <MasterTabPortfolio />
      </template>

      <template #about>
        <MasterTabAbout
          :bio="master.bio"
          :experience="master.experience"
          :location="master.location"
          :instagram="master.instagram"
        />
      </template>
    </UTabs>
  </div>
</template>
