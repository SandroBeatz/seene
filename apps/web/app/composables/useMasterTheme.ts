import type { MasterSettings } from '#shared/types/master'

interface MasterThemeConfig {
  theme: MasterPageTheme
  /** Preset key or '#RRGGBB' */
  accent: string
  radius: string
}

/**
 * Shared master theme state.
 * The master's pages call setTheme() with the master's settings; the master and
 * booking layouts read cssVars reactively. The variables are set on the layout
 * wrapper, not on :root, so the marketing site keeps its own theme.
 */
export function useMasterTheme() {
  const config = useState<MasterThemeConfig>('masterTheme', () => ({
    theme: DEFAULT_PAGE_THEME,
    accent: DEFAULT_PAGE_ACCENT,
    radius: '0.5rem'
  }))

  const palette = computed(() => masterPalette(config.value.theme, config.value.accent))

  // Palette → Nuxt UI semantic variables, so every U* component follows the
  // master's theme and color without per-component overrides.
  const cssVars = computed<Record<string, string>>(() => {
    const p = palette.value
    return {
      'color-scheme': config.value.theme,
      '--ui-radius': config.value.radius,
      '--ui-primary': p.accent,
      '--ui-bg': p.bg,
      '--ui-bg-elevated': p.card,
      '--ui-bg-muted': p.surface,
      '--ui-bg-accented': p.line,
      '--ui-bg-inverted': p.ink,
      '--ui-text': p.ink,
      '--ui-text-highlighted': p.ink,
      '--ui-text-toned': p.ink,
      '--ui-text-muted': p.muted,
      '--ui-text-dimmed': p.muted,
      // Solid primary buttons put text-inverted on bg-primary.
      '--ui-text-inverted': p.onAccent,
      '--ui-border': p.line,
      '--ui-border-muted': p.line,
      '--ui-border-accented': p.muted,
      '--ui-border-inverted': p.ink,
      '--seene-accent-soft': p.accentSoft,
      '--seene-accent-text': p.accentText
    }
  })

  // UTheme `ui` prop — component-level slot class overrides (extend as needed)
  const themeUi = computed(() => ({
    main: {
      base: 'bg-default'
    },
    avatar: {
      root: 'size-24 bg-primary',
      fallback: 'text-3xl text-inverted'
    },
    button: {
      base: 'rounded-sm'
    },
    tabs: {
      list: 'p-0 bg-transparent gap-2',
      trigger: 'cursor-pointer border border-primary data-[state=inactive]:text-highlighted',
      indicator: 'h-full top-0 bg-primary transition-[translate,width] duration-300 ease-out'
    }
  }))

  function setTheme(next: Partial<MasterThemeConfig>) {
    config.value = { ...config.value, ...next }
  }

  /** Theme and accent from the master's settings (API data). */
  function setMasterSettings(settings: Pick<MasterSettings, 'page_theme' | 'page_accent'>) {
    setTheme({ theme: settings.page_theme, accent: settings.page_accent })
  }

  return { cssVars, palette, themeUi, setTheme, setMasterSettings }
}
