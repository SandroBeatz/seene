<script setup lang="ts">
/** "Кому подходит": a photo mosaic of specialties; three are marked "soon". */
const { $ts } = useI18n()

type Tile = {
  key: string
  name: string
  id: string
  tint: string
  shape?: 'big' | 'tall' | 'wide'
  soon?: boolean
}

const tiles: Tile[] = [
  { key: 'manicure', name: 'c-01-manicure', id: 'C-01', tint: '#8E6F66', shape: 'big' },
  { key: 'lashes', name: 'c-02-lashes', id: 'C-02', tint: '#7A6058', shape: 'tall' },
  { key: 'brows', name: 'c-03-brows', id: 'C-03', tint: '#9C7B70' },
  { key: 'pedicure', name: 'c-04-pedicure', id: 'C-04', tint: '#85695F' },
  { key: 'depilation', name: 'c-05-sugaring', id: 'C-05', tint: '#A08A82', soon: true },
  { key: 'haircut', name: 'c-06-haircut', id: 'C-06', tint: '#94807A', soon: true },
  { key: 'massage', name: 'c-07-massage', id: 'C-07', tint: '#8B776F', shape: 'wide', soon: true }
]

const shapeClass = {
  big: 'col-span-2 md:row-span-2',
  tall: 'md:row-span-2',
  wide: 'col-span-2'
}
</script>

<template>
  <section class="border-b border-line">
    <div class="site-container flex flex-col gap-10 py-22">
      <div v-reveal class="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div class="flex flex-col gap-3.5">
          <div class="site-eyebrow">{{ $ts('audience.eyebrow') }}</div>
          <h2 class="site-h2 text-ink">{{ $ts('audience.title') }}</h2>
        </div>
        <p class="m-0 max-w-[360px] text-[16px] leading-normal text-ink-muted">
          {{ $ts('audience.description') }}
        </p>
      </div>

      <div class="grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4">
        <div
          v-for="(tile, i) in tiles"
          :key="tile.key"
          v-reveal="i"
          class="group relative overflow-hidden rounded-[24px]"
          :class="tile.shape ? shapeClass[tile.shape] : ''"
        >
          <div
            class="absolute inset-0 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          >
            <SiteImage
              :id="tile.id"
              :name="tile.name"
              :alt="$ts(`audience.${tile.key}.alt`)"
              :tint="tile.tint"
              id-at="top"
              sizes="(max-width: 767px) 100vw, 600px"
            />
          </div>
          <div
            class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/30 to-transparent"
          />
          <span
            v-if="tile.soon"
            class="absolute top-3.5 right-3.5 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-semibold text-ink"
          >
            {{ $ts('audience.soon') }}
          </span>
          <span
            class="absolute bottom-4 left-4.5 font-semibold tracking-[-0.02em] text-white"
            :class="tile.shape === 'big' ? 'text-[26px]' : 'text-[20px]'"
          >
            {{ $ts(`audience.${tile.key}.label`) }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
