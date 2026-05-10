export default defineAppConfig({
  ui: {
    colors: {
      primary: 'zinc',
      secondary: 'red',
      neutral: 'zinc'
    },

    header: {
      slots: {
        root: 'h-(--ui-header-height)',
      },
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

    pageCard: {
      slots: {
        root: 'rounded-xl shadow-lg'
      }
    }
  }
})
