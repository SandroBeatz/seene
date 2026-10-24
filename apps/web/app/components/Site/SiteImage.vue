<script setup lang="ts">
import manifest from '~/assets/images/site/site-images.json'

/**
 * A picture from the image spec, by its file name (`h-01-hero`). Files live in
 * `app/assets/images/site/` and are imported with `pnpm web images` (see
 * `scripts/site-images.sh`): `<name>.webp`, an optional phone crop
 * `<name>-mobile.webp`, and 640 px copies (`@640`) for srcset; the browser
 * picks the lightest file for the box. Until a picture exists, the design's
 * placeholder is shown: a tinted block with the picture's ID.
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
    /** Rendered width of the box, for srcset (`sizes` attribute) */
    sizes?: string
    /** Where the placeholder puts its ID */
    idAt?: 'top' | 'bottom'
    /** Which part of the picture stays in view when the box crops it */
    position?: string
  }>(),
  {
    tint: '#E9DCD5',
    priority: false,
    sizes: '100vw',
    idAt: 'bottom',
    position: 'center'
  }
)

const files = import.meta.glob<string>('../../assets/images/site/*.webp', {
  eager: true,
  import: 'default',
  query: '?url'
})

/** Every file's [width, height], written by the import script */
const fileSizes: Record<string, number[] | undefined> = manifest

function url(name: string) {
  return Object.entries(files).find(([path]) => path.endsWith(`/${name}.webp`))?.[1]
}

/** srcset of a file and its 640 px copy */
function srcset(name: string) {
  return [`${name}@640`, name]
    .map((file) => ({ src: url(file), size: fileSizes[file] }))
    .filter((item) => item.src && item.size)
    .map((item) => `${item.src} ${item.size![0]}w`)
    .join(', ')
}

const src = computed(() => url(props.name))
const size = computed(() => fileSizes[props.name])
const mobile = computed(() =>
  url(`${props.name}-mobile`) ? srcset(`${props.name}-mobile`) : undefined
)
</script>

<template>
  <picture v-if="src" class="block size-full">
    <source v-if="mobile" media="(max-width: 767px)" :srcset="mobile" :sizes="sizes" />
    <img
      :src="src"
      :srcset="srcset(name)"
      :sizes="sizes"
      :width="size?.[0]"
      :height="size?.[1]"
      :alt="alt"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      class="size-full object-cover"
      :style="{ objectPosition: position }"
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
      class="rounded-[8px] bg-white/70 px-2.5 py-1.5 text-[12px] font-semibold tabular-nums text-[#6B5A53]"
      aria-hidden="true"
    >
      {{ id }}
    </span>
  </div>
</template>
