---
name: i18n
description: Mandatory i18n skill for the Seene project. Use before any UI, markup, component, page, layout, or Vue template work that involves visible text, labels, titles, descriptions, buttons, placeholders, aria-labels, alt text, navigation items, error messages, or other human-readable strings. Use when adding or editing localized routes or internal links. Use with --check to scan app Vue files for hardcoded visible text and offer migration to locale files. The project uses nuxt-i18n-micro with en, fr, and ru locales; hardcoded user-facing strings are bugs.
---

# i18n Skill - Seene Project

## Stack

- Library: `nuxt-i18n-micro` in `nuxt.config.ts`
- Locales: `en` default, `fr`, `ru`
- Translation directory: `locales/` at the project root

## Vue Usage

In templates, use `$t` directly:

```vue
<UButton :label="$t('nav.cta')" />
{{ $t('hero.title') }}
<img :alt="$t('hero.imageAlt')" />
```

In `<script setup>`, destructure from `useI18n()`:

```vue
const { $t } = useI18n() const navItems = computed(() => [{ label: $t('layout.nav.about') }])
```

Use `computed()` for arrays, objects, labels, and props that should update when the locale changes.

## Locale Files

Global copy belongs in:

```text
locales/en.json
locales/fr.json
locales/ru.json
```

Page-specific copy belongs in matching route folders:

```text
locales/pages/index/en.json
locales/pages/about/en.json
locales/pages/[username]/en.json
```

Page keys are flat at runtime, so avoid collisions by scoping keys by section, for example
`hero.title`, `features.cards.nails`, or `profile.tabs.portfolio`.

## Key Rules

1. Check `locales/en.json`, `locales/fr.json`, and `locales/ru.json` before adding a key.
2. Reuse an existing key when the meaning already matches.
3. Add new keys in camelCase dot notation.
4. Avoid generic names such as `title`, `button`, or `text`.
5. Always update all three locale files in the same change.

If a translation is uncertain, make a reasonable version instead of leaving a missing key.

## Internal Links

This project uses localized routes. Never hardcode internal links such as `to="/about"` in UI.
Use `$localePath()` for every internal route:

```vue
<UButton :to="$localePath('/about')" :label="$t('nav.about')" />
```

In script setup:

```vue
const { $t, $localePath } = useI18n() const navItems = computed(() => [{ label: $t('nav.about'), to:
$localePath('/about') }])
```

External URLs, `mailto:`, and `tel:` links do not use `$localePath()`.

## Accessibility Text

Translate `aria-label`, `alt`, placeholders, tooltips, validation messages, and empty states.
They are user-facing text even when not visually prominent.

## Check Mode

When invoked with `--check`:

1. Scan `app/**/*.vue` for hardcoded human-readable strings in text nodes and attributes.
2. Skip CSS classes, URLs, icon names, route paths, and existing `$t(...)` usage.
3. Report file, line, string, and suggested key.
4. Ask before migrating findings.
5. For approved findings, replace strings with `$t('key')` and add values to all three locale files.

## Final Checklist

- No visible user-facing string is hardcoded.
- New keys exist in `en`, `fr`, and `ru`.
- Script-generated labels use `computed()`.
- Internal links use `$localePath()`.
- `aria-label` and `alt` text are localized.
