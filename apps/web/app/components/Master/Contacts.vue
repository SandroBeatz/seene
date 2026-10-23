<script setup lang="ts">
import type { MasterProfile } from '#shared/types/master'

const props = defineProps<{
  profile: MasterProfile
}>()

const { $ts } = useI18n()

const MAX_CONTACTS = 5

/** Filled contacts only, in the spec's order, at most 5 in a row. */
const contacts = computed(() => {
  const p = props.profile
  const mapUrl = masterMapLink(p)

  const items = [
    {
      key: 'whatsapp',
      icon: 'i-simple-icons-whatsapp',
      to: p.whatsapp && whatsappLink(p.whatsapp),
      brand: true
    },
    {
      key: 'instagram',
      icon: 'i-simple-icons-instagram',
      to: p.instagram && instagramLink(p.instagram)
    },
    {
      key: 'telegram',
      icon: 'i-simple-icons-telegram',
      to: p.telegram && telegramLink(p.telegram)
    },
    { key: 'map', icon: 'i-lucide-map-pin', to: mapUrl },
    {
      key: 'tiktok',
      icon: 'i-simple-icons-tiktok',
      to: p.tiktok && `https://tiktok.com/@${p.tiktok.replace(/^@/, '')}`
    },
    { key: 'email', icon: 'i-lucide-mail', to: p.contact_email && `mailto:${p.contact_email}` }
  ]

  return items
    .filter((item): item is typeof item & { to: string } => !!item.to)
    .slice(0, MAX_CONTACTS)
})
</script>

<template>
  <nav v-if="contacts.length" :aria-label="$ts('master.contacts.aria')">
    <ul class="grid grid-cols-5 gap-1.5">
      <li v-for="item in contacts" :key="item.key">
        <ULink
          :to="item.to"
          :target="item.key === 'email' ? undefined : '_blank'"
          rel="noopener noreferrer"
          class="group flex flex-col items-center gap-1.5 text-[11px] text-muted"
        >
          <span
            class="flex size-13 items-center justify-center rounded-full transition-transform duration-150 group-active:scale-95"
            :class="item.brand ? 'bg-[#0E7A3F] text-white' : 'bg-muted text-highlighted'"
          >
            <UIcon :name="item.icon" class="size-5.5" />
          </span>
          {{ $ts(`master.contacts.${item.key}`) }}
        </ULink>
      </li>
    </ul>
  </nav>
</template>
