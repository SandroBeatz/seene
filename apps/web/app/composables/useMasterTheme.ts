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
  const themeUi = computed(() => ({
    main: {
      base: 'bg-white'
    },
    avatar: {
      root: 'size-24 bg-zinc-900',
      fallback: 'text-3xl text-white'
    },
    button: {
      base: 'rounded-sm'
    },
    tabs: {
      list: 'p-0 bg-transparent gap-2',
      trigger: 'cursor-pointer border border-zinc-900 data-[state=inactive]:text-zinc-900',
      indicator: 'h-full top-0 bg-zinc-900 transition-[translate,width] duration-300 ease-out'
    }
  }))

  function setTheme(next: MasterThemeConfig) {
    config.value = next
  }

  return { cssVars, themeUi, setTheme }
}
