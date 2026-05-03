# Repository Guidelines

## Project Structure & Module Organization

This is a Nuxt 4 application using Nuxt UI, Tailwind CSS, and `nuxt-i18n-micro`.
Application code lives in `app/`: pages in `app/pages`, layouts in `app/layouts`,
shared Vue components in `app/components`, composables in `app/composables`, and global
styles/assets in `app/assets`. Static public files belong in `public/`. Localized copy is
stored under `locales/`, with page-specific files such as `locales/pages/about/en.json`.
Project documentation lives in `docs/`.

## Build, Test, and Development Commands

Use `pnpm` as the package manager; the repo declares `pnpm@10.33.0`.

- `pnpm install`: install dependencies and run Nuxt preparation.
- `pnpm dev`: start the local Nuxt dev server.
- `pnpm build`: build the production application.
- `pnpm preview`: serve the production build locally after `pnpm build`.
- `pnpm lint`: run ESLint across the repository.
- `pnpm lint:fix`: apply safe ESLint fixes.
- `pnpm format:check`: check Prettier formatting.
- `pnpm format`: format files with Prettier.
- `pnpm typecheck`: run Nuxt/Vue TypeScript checks.

## Coding Style & Naming Conventions

Follow the existing Vue single-file component style and Nuxt conventions. Use PascalCase
for components, for example `ProfileHeader.vue`, and camelCase for composables, for
example `useMasterTheme.ts`. Prettier is configured for no semicolons, single quotes, no
trailing commas, and a 100-character line width. Prefer Nuxt auto-imports and local
framework patterns over adding new abstractions.

## Internationalization

Visible user-facing text should be localized in all supported languages: `en`, `fr`, and
`ru`. When adding a page or route-specific string, update the matching files under
`locales/pages/...`; shared navigation or app-wide copy belongs in `locales/en.json`,
`locales/fr.json`, and `locales/ru.json`.

## Testing Guidelines

There is no committed test suite yet. For now, validate changes with `pnpm lint`,
`pnpm typecheck`, and `pnpm build`. If adding tests, keep them close to the feature they
cover and use clear names that describe behavior, such as `ProfileHeader.spec.ts`.

## Commit & Pull Request Guidelines

Recent history uses short, imperative commits, often with Conventional Commit prefixes
such as `feat:`, `fix:`, and `refactor:`. Keep commits focused and descriptive. Pull
requests should include a brief summary, validation steps run, linked issues when
applicable, and screenshots for visual or responsive UI changes.
