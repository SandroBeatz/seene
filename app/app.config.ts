export default defineAppConfig({
  ui: {
    colors: {
      primary: 'zinc',
      secondary: 'red',
      neutral: 'zinc'
    },

    header: {
      slots: {
        root: 'h-(--ui-header-height)'
      }
    },

    button: {
      slots: {
        base: 'rounded-3xl'
      }
    },

    input: {
      slots: {
        root: 'rounded-3xl',
        base: 'rounded-3xl'
      }
    },

    card: {
      slots: {
        root: 'rounded-lg shadow-lg'
      }
    },

    drawer: {
      slots: {
        overlay: 'bg-neutral-800/50 backdrop-blur-sm'
      }
    },

    // Same dimmed + blurred backdrop as drawers. Modal sets its overlay color in
    // the `overlay: true` variant, so it has to be overridden there.
    modal: {
      variants: {
        overlay: {
          true: {
            overlay: 'bg-neutral-800/50 backdrop-blur-sm'
          }
        }
      }
    },

    empty: {
      slots: {
        avatar: 'bg-neutral-100 text-primary'
      }
    },

    pageCard: {
      slots: {
        root: 'rounded-xl shadow-lg'
      }
    },
    pageSection: {
      slots: {
        container: 'py-12 sm:py-18 lg:py-24'
      }
    }
  }
})
