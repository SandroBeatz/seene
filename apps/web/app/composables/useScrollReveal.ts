import { type Ref, onMounted, onUnmounted, ref } from 'vue'

interface ScrollRevealOptions {
  threshold?: number
  staggerMs?: number
}

/**
 * Single-element scroll reveal.
 * Usage:
 *   const el = ref<HTMLElement>()
 *   const { isVisible } = useScrollReveal(el)
 *
 * Template:
 *   :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
 *   class="transition-all duration-700"
 */
export function useScrollReveal(
  target: Ref<HTMLElement | null | undefined>,
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.15 } = options
  const isVisible = ref(false)

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value) return
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          isVisible.value = true
          observer?.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(target.value)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { isVisible }
}

/**
 * Multi-element staggered scroll reveal.
 * Usage:
 *   const els = ref<HTMLElement[]>([])
 *   const { isVisible, getDelay } = useScrollRevealList(els)
 *
 * Template (v-for item at index i):
 *   :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
 *   :style="{ transitionDelay: getDelay(i), transitionDuration: '600ms' }"
 *   class="transition-all"
 */
export function useScrollRevealList(
  targets: Ref<HTMLElement[]>,
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.15, staggerMs = 100 } = options
  const isVisible = ref(false)

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!targets.value.length) return
    // Observe the first element; once it's visible, reveal all with stagger
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          isVisible.value = true
          observer?.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(targets.value[0]!)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  const getDelay = (index: number) => `${index * staggerMs}ms`

  return { isVisible, getDelay }
}
