# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm lint         # ESLint
pnpm typecheck    # Vue type checking via vue-tsc
```

## Stack

- **Nuxt 4** with `app/` directory layout
- **Nuxt UI v3** — component library (prefix `U`, e.g. `UButton`, `UPageHero`)
- **Tailwind v4** — via `@import "tailwindcss"` in CSS, no config file
- **TypeScript** — strict, checked with `nuxt typecheck`
- **ESLint** via `@nuxt/eslint` (stylistic: no trailing commas, 1tbs braces)

## Architecture

All source lives in `app/`:

- `app/app.vue` — root layout: `UApp > UHeader / UMain / UFooter`
- `app/app.config.ts` — Nuxt UI theme config (colors, component slot overrides)
- `app/pages/` — file-based routing
- `app/components/` — auto-imported Vue components
- `app/assets/css/main.css` — global styles entry point (imported by `nuxt.config.ts`)

## Design System

Theme colors are configured through Nuxt UI semantic tokens:

| Token       | Scale name | Use                                |
| ----------- | ---------- | ---------------------------------- |
| `primary`   | `zinc`     | Main actions and inverted surfaces |
| `secondary` | `sky`      | Instagram-like action accent       |
| `neutral`   | `zinc`     | Text, backgrounds, borders         |

Use Nuxt UI semantic classes such as `text-muted`, `bg-elevated`, `bg-inverted`, and component props like `color="primary"` or `color="secondary"`. The app intentionally supports light mode only; semantic `--ui-*` variables are overridden in the `:root` block in `main.css`.

The header is styled floating/rounded via `app.config.ts` slot overrides — do not add a `border` or sticky class directly on `UHeader` or it will conflict.

## Skills

Project-local skills live in `.claude/skills/`. Two skills are mandatory for UI/markup work and must both be invoked:

- **`nuxt-ui`** — enforces Nuxt UI component lookup via context7 MCP before writing any template code
- **`i18n`** — enforces i18n rules: all visible text must be wrapped in `$t()`, keys managed across `locales/en.json`, `locales/fr.json`, `locales/ru.json`. Invoke with `--check` to audit hardcoded strings across the project.

## Project Context

Seene is an online booking platform for beauty professionals (nail techs, brow artists, lash makers, makeup artists) — targeting Russian-speaking market. The homepage (`app/pages/index.vue`) is the primary marketing landing page.
