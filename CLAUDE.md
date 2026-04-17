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
- `app/assets/css/theme.css` — standalone color reference (not imported; `main.css` is the source of truth)

## Design System

Custom color palette defined in `app/assets/css/main.css` via `@theme static {}`:

| Token     | Scale name | Use                                       |
| --------- | ---------- | ----------------------------------------- |
| `primary` | `gold`     | Brand accent (buttons, links, focus ring) |
| `neutral` | `warm`     | Text, backgrounds, borders                |
| `olive`   | `olive`    | Secondary accent                          |

Nuxt UI maps `--ui-color-primary-{n}` → `--color-gold-{n}` automatically. Use `color="primary"` on components; use `color="olive"` for secondary accents. Light/dark semantic `--ui-*` variables are overridden in `:root` and `.dark` blocks in `main.css`.

The header is styled floating/rounded via `app.config.ts` slot overrides — do not add a `border` or sticky class directly on `UHeader` or it will conflict.

## Skills

Project-local skills live in `.claude/skills/`. The `nuxt-ui` skill **must** be invoked before any UI/markup/component work — it enforces Nuxt UI component lookup via context7 MCP before writing any template code.

## Project Context

Seene is an online booking platform for beauty professionals (nail techs, brow artists, lash makers, makeup artists) — targeting Russian-speaking market. The homepage (`app/pages/index.vue`) is the primary marketing landing page.
