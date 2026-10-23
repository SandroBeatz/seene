<script setup lang="ts">
/**
 * A picture from the image spec, by its file name (`h-01-hero`). Files live in
 * `app/assets/images/site/` as `<name>.webp` (or `.jpg`), with an optional
 * phone crop `<name>-mobile.webp`; dropping a file there is enough, the page
 * picks it up on the next build. Until then the design's placeholder is shown:
 * a tinted block with the picture's ID.
 */
const props = withDefaults(
  defineProps<{
    /** File name without extension, e.g. `c-01-manicure` */
    name: string
    /** ID from the image spec, shown on the placeholder, e.g. `C-01` */
    id: string
    alt: string
    /** Placeholder tint */
    tint?: string
    /** The hero picture: loaded first, not lazily */
    priority?: boolean
    sizes?: string
    /** Where the placeholder puts its ID */
    idAt?: 'top' | 'bottom'
  }>(),
  { tint: '#E9DCD5', priority: false, sizes: '100vw', idAt: 'bottom' }
)

const files = import.meta.glob<string>('../../assets/images/site/*.{webp,jpg,avif}', {
  eager: true,
  import: 'default',
  query: '?url'
})

function find(name: string) {
  const entry = Object.entries(files).find(([path]) => /\/([^/]+)\.\w+$/.exec(path)?.[1] === name)
  return entry?.[1]
}

const src = computed(() => find(props.name))
const mobileSrc = computed(() => find(`${props.name}-mobile`))
</script>

<template>
  <picture v-if="src" class="block size-full">
    <source v-if="mobileSrc" media="(max-width: 767px)" :srcset="mobileSrc" />
    <img
      :src="src"
      :alt="alt"
      :sizes="sizes"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      class="size-full object-cover"
    />
  </picture>
  <div
    v-else
    role="img"
    :aria-label="alt"
    class="flex size-full p-4"
    :class="idAt === 'top' ? 'items-start' : 'items-end'"
    :style="{ backgroundColor: tint }"
  >
    <span
      class="rounded-lg bg-white/70 px-2.5 py-1.5 font-mono text-xs text-[#6B5A53]"
      aria-hidden="true"
    >
      {{ id }}
    </span>
  </div>
</template>
