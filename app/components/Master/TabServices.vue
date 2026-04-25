<script setup lang="ts">
interface Service {
  id: number
  name: string
  description: string
  price: number
  currency: string
  duration: number
}

const services: Service[] = [
  { id: 1, name: 'Маникюр с покрытием', description: 'Обработка, форма, гель-лак любого цвета', price: 2500, currency: '₽', duration: 60 },
  { id: 2, name: 'Педикюр классический', description: 'Обработка стоп, форма ногтей, уход за кожей', price: 3000, currency: '₽', duration: 75 },
  { id: 3, name: 'Наращивание ногтей', description: 'Акрил или гель, любая форма и длина', price: 4500, currency: '₽', duration: 120 },
  { id: 4, name: 'Снятие покрытия', description: 'Аккуратное снятие без вреда для ногтя', price: 500, currency: '₽', duration: 20 },
  { id: 5, name: 'Дизайн ногтей', description: 'Рисунки, стемпинг, фольга, стразы', price: 300, currency: '₽', duration: 30 }
]
</script>

<template>
  <div class="flex flex-col">
    <div
      v-for="(service, index) in services"
      :key="service.id"
    >
      <div class="flex items-start justify-between gap-4 py-4">
        <div class="flex flex-col gap-1 min-w-0">
          <span class="font-medium text-(--ui-text-highlighted)">{{ service.name }}</span>
          <span class="text-sm text-(--ui-text-muted)">{{ service.description }}</span>
          <span class="text-xs text-(--ui-text-subtle)">{{ service.duration }} {{ $ts('master.services.duration') }}</span>
        </div>
        <span class="font-bold text-lg text-primary shrink-0 whitespace-nowrap">
          {{ service.price }} {{ service.currency }}
        </span>
      </div>
      <USeparator v-if="index < services.length - 1" />
    </div>
  </div>
</template>
