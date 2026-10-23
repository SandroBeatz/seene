---
version: 2.0
date: 2026-05-08
---

# Theme & CSS Variables

> Version 2.0 · 2026-05-08

## Overview

Nuxt UI v4 provides semantic CSS variables and matching Tailwind utilities through
`@nuxt/ui` in `app/assets/css/main.css`. This project keeps theme configuration in two
places only:

- `app/app.config.ts` maps Nuxt UI colors to Tailwind scales.
- `app/assets/css/main.css` overrides the semantic `--ui-*` variables.

There is no separate `theme.css`; `main.css` is the source of truth.

## Color Roles

| Role        | Scale | Purpose                                   |
| ----------- | ----- | ----------------------------------------- |
| `primary`   | zinc  | Main actions, strong text, black/white UI |
| `secondary` | sky   | Instagram-like blue action accent         |
| `neutral`   | zinc  | Text, backgrounds, borders                |

`primary` resolves close to black through `--ui-primary`. `secondary` uses sky blue for
links, small highlights, and badges. The app intentionally supports light mode only.

## Semantic Tokens

Prefer Nuxt UI utilities over direct variable access:

```html
<p class="text-muted">Secondary text</p>
<div class="bg-elevated border border-default rounded-lg">...</div>
<section class="bg-inverted text-inverted">...</section>
<UButton color="primary" />
<UBadge color="secondary" />
```

Avoid old project-specific variables and obsolete custom scales:

```html
<!-- Do not use -->
<section class="bg-[var(--section-bg-warm)]"></section>
<span class="text-[var(--color-heading)]"></span>
<UButton color="olive" />
```

## Files

```text
app/
├── app.config.ts          # Nuxt UI color mapping and component slot defaults
└── assets/css/main.css    # Global theme tokens and base body styles
```
