---
name: i18n
description: >
  Mandatory i18n skill for the Seene project. MUST be invoked before any UI/markup/component
  work that involves visible text — labels, titles, descriptions, buttons, placeholders,
  aria-labels, alt text, navigation items, error messages, or any human-readable string.
  This includes: writing new Vue components, editing existing templates, adding props with text
  values, building pages, modifying layouts. Even if the user just says "add a button" or
  "update the title" — invoke this skill. The project uses nuxt-i18n-micro with three locales:
  en, fr, ru. Hardcoded strings are a bug, not a style preference.

  Special mode: when invoked with `--check` argument, scan the entire project for hardcoded text
  and offer to migrate each occurrence interactively.
---

# i18n Skill — Seene Project

## Stack

- Library: **nuxt-i18n-micro** (`nuxt.config.ts` → `modules: ['nuxt-i18n-micro']`)
- Locales: **en** (default), **fr**, **ru**
- Translation dir: `locales/` (project root)

## Usage in Vue files

**In `<template>`** — `$t` is globally available, no import needed:

```vue
<UButton :label="$t('nav.cta')" />
{{ $t('hero.title') }}
<img :alt="$t('hero.imageAlt')" />
```

**In `<script setup>`** — destructure from `useI18n()`:

```vue
<script setup lang="ts">
const { $t } = useI18n()

const navItems = [{ label: $t('layout.nav.about'), to: '/about' }]
</script>
```

> Note: `$t` in script setup runs at setup time. For reactive values that depend on locale
> switching, use computed: `const label = computed(() => $t('key'))`.

---

## Locale file structure

```
locales/
  en.json                    ← global / common translations
  fr.json
  ru.json
  pages/
    index/
      en.json                ← page-specific (auto-loaded for app/pages/index.vue)
      fr.json
      ru.json
    about/
      en.json
      ...
```

**Page translations** are auto-loaded by nuxt-i18n-micro based on the route. The key namespace
is flat — both global and page-local keys are accessed via `$t('key')`. To avoid collisions,
page keys are scoped by section (e.g. `hero.title`, not just `title`).

---

## Key naming rules

### Step 1 — Check common translations first

Before creating a new key, read the global files:

- `locales/en.json`
- `locales/fr.json`
- `locales/ru.json`

If the meaning already exists (e.g. `nav.cta`, `footer.copyright`), **reuse that key**. Do not
duplicate common phrases.

### Step 2 — Scope new keys by context

If no matching common key exists, create a new one. Use dot-notation scoped to the section/component:

| Context                | Key pattern                | Example                              |
| ---------------------- | -------------------------- | ------------------------------------ |
| Global layout / header | `nav.{name}`               | `nav.cta`, `nav.about`               |
| Global layout / footer | `footer.{name}`            | `footer.copyright`, `footer.privacy` |
| Page section           | `{section}.{name}`         | `hero.title`, `features.subtitle`    |
| Nested data            | `{section}.{group}.{name}` | `features.cards.nails`               |
| Component-specific     | `{componentName}.{name}`   | `bookingForm.placeholder`            |

**Rules:**

- Keys are camelCase, no hyphens
- Be descriptive: `hero.ctaButton` not `hero.btn1`
- Group related keys under a shared parent: `steps.title`, `steps.register`, `steps.setup`
- Avoid generic keys like `button` or `text` — they break when reused in different contexts

### Step 3 — Decide where to put the key

| Text belongs to...                  | File location                     |
| ----------------------------------- | --------------------------------- |
| App-wide reusable phrase            | `locales/{lang}.json`             |
| A specific page (e.g. `/`)          | `locales/pages/index/{lang}.json` |
| A specific sub-page (e.g. `/about`) | `locales/pages/about/{lang}.json` |

For layout-level text (header, footer nav items), use `locales/{lang}.json` — it's global.

---

## Always update all three locales

When adding or modifying a key, **always update en.json, fr.json, and ru.json** in the same step.
Never leave a locale file missing a key that exists in others.

If you don't know the French or Russian translation, make a reasonable translation. The developer
can correct it, but a placeholder is better than a missing key (which breaks at runtime).

---

## Handling dynamic / computed text in script

When text is built dynamically (arrays, objects used as component props), use `$t` inside a
`computed()` so translations stay reactive:

```vue
<script setup lang="ts">
const { $t } = useI18n()

const cards = computed(() => [
  { title: $t('features.cards.nails'), icon: 'i-lucide-hand' },
  { title: $t('features.cards.brows'), icon: 'i-lucide-eye' }
])
</script>
```

---

## aria-label and alt text

These are human-readable and must also be translated:

```vue
<UButton :aria-label="$t('nav.openMenu')" />
<img :alt="$t('hero.imageAlt')" />
```

---

## Internal links and routing

This project uses nuxt-i18n-micro with `prefix_except_default` strategy:

- English (default): `/about`, `/signup`, `/`
- Russian: `/ru/about`, `/ru/signup`, `/ru/`
- French: `/fr/about`, `/fr/signup`, `/fr/`

**A hardcoded `to="/about"` always navigates to the English version.** When the user has switched to Russian and clicks such a link, the locale resets. This is a bug.

**Always use `$localePath(path)` for every internal link.** It returns the path prefixed with the active locale.

In `<script setup>` — add `$localePath` to the destructuring:

```vue
<script setup lang="ts">
const { $t, $localePath } = useI18n()

const navItems = computed(() => [{ label: $t('nav.about'), to: $localePath('/about') }])
</script>
```

In `<template>` — bind with `:to`:

```vue
<NuxtLink :to="$localePath('/')">Home</NuxtLink>
<UButton :to="$localePath('/signup')" :label="$t('nav.cta')" />
```

**Every place where `to` is set to an internal path must go through `$localePath()`** — navigation items, breadcrumbs, CTA buttons, card links, NuxtLink, `router.push()` calls. The only exceptions are external URLs (https://...) and mailto: links.

---

## --check mode

When this skill is invoked with `--check` (e.g. `/i18n --check`):

1. **Scan** all `.vue` files in `app/` for hardcoded human-readable strings:
   - Attribute values that are plain strings and not keys/paths/URLs/icons (e.g. `label="Начать"`)
   - Text nodes inside templates (e.g. `<p>Добро пожаловать</p>`)
   - Skip: icon names (`i-lucide-*`), URLs, route paths, CSS classes, color names, `aria-label`
     values that are clearly icon descriptions, values that are already using `$t`

2. **Present findings** grouped by file, showing:
   - File path
   - Line number
   - The hardcoded string
   - Suggested key name (following the naming rules above)

3. **Ask the user**: "Found N hardcoded strings. Translate them? (yes / no / select)"
   - If **yes**: migrate all of them
   - If **no**: do nothing
   - If **select** (or user names specific files/strings): migrate only those

4. **Migration** for each approved string:
   - Replace hardcoded value with `$t('key')` in the `.vue` file
   - Add the key to all three locale files (`en`, `fr`, `ru`)
   - If the hardcoded string is in Russian, use it as the `ru` value and translate to `en`/`fr`
   - If in English, use it as `en` and translate to `fr`/`ru`
   - Follow key placement rules (common vs page-specific)

---

## Quick checklist (run mentally before every UI task)

- [ ] Is there any visible text in this markup? → wrap in `$t()`
- [ ] Does an equivalent phrase exist in `locales/en.json`? → reuse the key
- [ ] New key? → scope it correctly, add to all three locale files
- [ ] Text built in `<script setup>` → use `computed()` for reactivity
- [ ] `aria-label` and `alt` → also translated
- [ ] Every internal `to` prop uses `$localePath()` — never a bare `/path` string
