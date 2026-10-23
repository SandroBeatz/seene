import type { Directive } from 'vue'

/**
 * `v-reveal` — a block rises 12 px into place the first time 20% of it is on
 * screen, then stays (animation spec). `v-reveal="i"` staggers cards by 60 ms,
 * at most 4 in a row; `v-reveal:sheet` slides a phone's bottom sheet up instead.
 * The hidden state is added only on the client, so the page reads without
 * JavaScript, and never for visitors who ask for reduced motion.
 */
const STAGGER_MS = 60
const MAX_STAGGERED = 4

let observer: IntersectionObserver | null = null
/** Watched element → the element it reveals (a sheet is watched by its phone) */
const reveals = new WeakMap<Element, HTMLElement>()

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        reveals.get(entry.target)?.classList.add('is-revealed')
        observer?.unobserve(entry.target)
      }
    },
    { threshold: 0.2 }
  )
  return observer
}

const reveal: Directive<HTMLElement, number | undefined> = {
  getSSRProps: () => ({}),
  mounted(el, binding) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const sheet = binding.arg === 'sheet'
    el.classList.add(sheet ? 'site-reveal-sheet' : 'site-reveal')
    if (binding.value) {
      el.style.transitionDelay = `${Math.min(binding.value, MAX_STAGGERED - 1) * STAGGER_MS}ms`
    }
    // A sheet starts outside its clipped parent, so it is never "visible" itself.
    const watched = sheet && el.parentElement ? el.parentElement : el
    reveals.set(watched, el)
    getObserver().observe(watched)
  },
  beforeUnmount(el, binding) {
    observer?.unobserve(binding.arg === 'sheet' && el.parentElement ? el.parentElement : el)
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', reveal)
})
