export default defineAppConfig({
  ui: {
    /*
     * Seene theme — Nuxt UI v3
     * primary  → gold scale (Amber 500 = #f59e0b)
     * neutral  → warm scale (Zinc)
     */
    colors: {
      primary: 'gold',
      neutral: 'warm',
      olive: 'olive'
    },

    /* ─── Header ─── */
    header: {
      slots: {
        root: 'h-(--ui-header-height) border-none fixed left-0 right-0 top-2 md:top-4 z-50 max-w-7xl mx-auto shadow-md rounded-2xl',
        container: 'flex items-center justify-between gap-3 h-full',
        left: 'lg:flex-1 flex items-center gap-1.5',
        center: 'hidden lg:flex',
        right: 'flex items-center justify-end lg:flex-1 gap-1.5',
        title: 'shrink-0 font-bold text-xl text-highlighted flex items-end gap-1.5',
        toggle: 'lg:hidden',
        content: 'lg:hidden',
        overlay: 'lg:hidden',
        header:
          'px-4 sm:px-6 h-(--ui-header-height) shrink-0 flex items-center justify-between gap-3',
        body: 'p-4 sm:p-6 overflow-y-auto'
      },
      variants: {
        toggleSide: {
          left: {
            toggle: '-ms-1.5'
          },
          right: {
            toggle: '-me-1.5'
          }
        }
      }
    },

    /* ─── Buttons: 24px radius ─── */
    button: {
      slots: {
        base: 'rounded-3xl'
      }
    },

    /* ─── Inputs: 24px radius + amber focus ─── */
    input: {
      slots: {
        root: 'rounded-3xl',
        base: 'rounded-3xl'
      }
    },

    /* ─── Cards: 24px radius ─── */
    card: {
      slots: {
        root: 'rounded-3xl shadow-lg'
      }
    },

    /* ─── Page card: 24px radius ─── */
    pageCard: {
      slots: {
        root: 'rounded-3xl shadow-lg'
      }
    }
  }
})
