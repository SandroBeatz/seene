interface MasterThemeConfig {
  primary?: string
  neutral?: string
  radius?: string
}

/**
 * Shared master theme state.
 * The profile page calls setTheme() with the master's config.
 * The master layout reads cssVars/themeUi reactively.
 */
export function useMasterTheme() {
  const config = useState<MasterThemeConfig>('masterTheme', () => ({
    radius: '0.5rem'
  }))

  // Map config → CSS custom properties for the layout wrapper div
  const cssVars = computed<Record<string, string>>(() => {
    const vars: Record<string, string> = {}
    if (config.value.radius) {
      vars['--ui-radius'] = config.value.radius
    }
    return vars
  })

  // UTheme `ui` prop — component-level slot class overrides (extend as needed)
  const themeUi = computed(() => ({}))

  function setTheme(next: MasterThemeConfig) {
    config.value = next
  }

  return { cssVars, themeUi, setTheme }
}
