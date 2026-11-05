<script setup lang="ts">
/**
 * A photo that fills its box: shimmer until it arrives, then a fade. It hides only
 * once JavaScript runs, so the page reads fine without it.
 */
defineProps<{
  src: string
  alt: string
  imgClass?: string
  priority?: boolean
}>()

const image = useTemplateRef('image')
const waiting = ref(false)

onMounted(() => {
  waiting.value = !image.value?.complete
})
</script>

<template>
  <span class="block size-full" :class="{ 'seene-skeleton': waiting }">
    <img
      ref="image"
      :src="src"
      :alt="alt"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : undefined"
      decoding="async"
      class="size-full object-cover transition-opacity duration-400 ease-out motion-reduce:transition-none"
      :class="[imgClass, { 'opacity-0': waiting }]"
      @load="waiting = false"
      @error="waiting = false"
    />
  </span>
</template>
