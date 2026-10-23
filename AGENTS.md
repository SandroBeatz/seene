# Seene monorepo

Seene is an online booking platform for solo beauty professionals. This repository holds
every part of the product that ships, plus the single source of truth for the database.

## Layout

| Path            | What                                                                 | Details                    |
| --------------- | -------------------------------------------------------------------- | -------------------------- |
| `apps/web`      | Nuxt 4 site: landing, pricing, master public page, online booking    | `apps/web/CLAUDE.md`       |
| `apps/mobile`   | Expo / React Native app for masters (replaces the old `master.seene`) | `apps/mobile/AGENTS.md`    |
| `supabase`      | Supabase config and **all** database migrations                      | this file, "Database"      |

The old Vue dashboard (`SandroBeatz/master.seene`) is not part of this repo and is no
longer developed. Its migration files were copied into `supabase/migrations`.

Each app keeps its own `CLAUDE.md` / `AGENTS.md`; read the one for the app you touch.

## Commands

pnpm workspaces (`pnpm@10.33.0`). Install once from the root: `pnpm install`.

```bash
pnpm web dev          # any apps/web script: pnpm web <script>
pnpm mobile start     # any apps/mobile script: pnpm mobile <script>
pnpm lint             # lint every app
pnpm typecheck        # typecheck every app
pnpm test             # tests in every app
```

- `.npmrc` sets `node-linker=hoisted`: Expo/Metro needs a flat `node_modules`.
- Add Expo packages with `npx expo install <pkg>` from `apps/mobile`; add web packages
  with `pnpm --filter @seene/web add <pkg>`.
- `pnpm-workspace.yaml` pins the Expo SDK 57 native set (`overrides`) to the versions
  the app shipped with before the move to pnpm, and applies `patchedDependencies`.
  Remove those pins on the next `npx expo install --fix` SDK upgrade.
- Never commit `bun.lock` or `package-lock.json`; `pnpm-lock.yaml` at the root is the
  only lockfile.

## Environments

| Environment | Branch    | Hosting    | Domain                 | Supabase                                  |
| ----------- | --------- | ---------- | ---------------------- | ----------------------------------------- |
| Staging     | `develop` | Vercel     | `seene-six.vercel.app` | `foxqkomqtpbxyeqqwzpm` (ap-southeast-1)   |
| Production  | `main`    | Cloudflare | `getseene.app`         | not created yet                           |

- Open feature and fix PRs against `develop`. Merging `develop` into `main` is a
  production release.
- Production is not set up yet: no Cloudflare deployment, no Supabase project.
  Until it is, nothing anywhere is production data.

## Database

One Supabase project per environment (see "Environments"). Today only staging exists:
`foxqkomqtpbxyeqqwzpm`.

Rules:

- Every schema change is a SQL file in `supabase/migrations/`, named
  `YYYYMMDDHHMMSS_snake_case.sql` (UTC). No other folder holds migrations.
- Apply migrations with the Supabase CLI from the repo root: `supabase db push`
  (after `supabase link --project-ref <ref>`). Do not change the schema with ad-hoc
  `execute_sql`, the dashboard SQL editor, or the MCP `apply_migration` tool.
- Commit the migration together with the code that depends on it, in one PR.
- After a schema change, regenerate types for every app that reads the table.
- There is no local database; `supabase start` is not used.

## Phone numbers

Canonical format everywhere (client, API, database): E.164 digits only, no `+`
(`996555123456`). Formatting is display-only. See `apps/web/shared/utils/phone.ts`.
The database enforces it on `client.phone` (CHECK `client_phone_canonical`): an app
that sends `+996 555 123 456` gets an error, so normalize before saving.

## Commits

Short imperative messages with Conventional Commit prefixes (`feat:`, `fix:`,
`chore:`); scope by app when useful (`feat(web): …`, `fix(mobile): …`).
