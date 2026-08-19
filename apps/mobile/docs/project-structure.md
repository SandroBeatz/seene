---
version: 1.0
date: 2026-08-19
category: architecture
status: proposed
---

# Project Structure

> Where every file goes and why. Enforces the FSD-lite layering from
> [mobile-architecture.md](./mobile-architecture.md). When in doubt about placement, consult the
> decision rules in §4.

## 1. Top-level

```
app.master.seene/
├── src/
│   ├── app/            # Expo Router routes ONLY (screens, layouts, guards) — thin
│   ├── widgets/        # composite screen-level blocks
│   ├── features/       # single user actions
│   ├── entities/       # domain units (api, model, ui, lib)
│   └── shared/         # api client, config, lib, theme, ui kit
├── assets/             # images, fonts, icons (native app assets)
├── docs/               # this documentation set
├── app.json            # Expo config (CNG — native config lives here, not ios/android)
├── package.json
└── tsconfig.json       # path aliases (@/ , @shared/ , @entities/ , @features/ , @widgets/)
```

> **Routes live in `src/app/`** (the Expo Router "src" convention), not a root `app/`. Non-route
> code never goes in `src/app/`.

## 2. `src/app/` — routing (thin)

```
src/app/
├── _layout.tsx                 # root: providers (QueryClient, gesture root, safe-area,
│                               #   Unistyles theme, i18n, Sentry) + auth guard
├── index.tsx                   # entry redirect (→ tabs or auth based on session)
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── (onboarding)/
│   ├── _layout.tsx             # onboarding shell + step guard
│   ├── specializations.tsx
│   ├── personal.tsx
│   ├── location.tsx
│   ├── schedule.tsx
│   └── review.tsx
├── (tabs)/
│   ├── _layout.tsx             # native tab bar
│   ├── home.tsx
│   ├── calendar.tsx
│   ├── clients.tsx
│   ├── analytics.tsx
│   └── settings/
│       ├── _layout.tsx
│       ├── index.tsx           # settings hub
│       ├── profile.tsx
│       ├── contacts.tsx
│       ├── working-hours.tsx
│       ├── booking.tsx
│       ├── payment-methods.tsx
│       ├── service-categories.tsx
│       ├── notifications.tsx
│       ├── system-region.tsx
│       └── account.tsx
└── +not-found.tsx
```

Each screen file imports one or a few widgets/features and wires navigation. **No data fetching or
business logic beyond calling a widget.**

## 3. `src/{widgets,features,entities,shared}`

```
src/widgets/                    # composite, screen-level
├── home/                       # greeting + overview + schedule timeline + actions
├── calendar/                   # native calendar (agenda/day/week)
├── appointment-preview-sheet/  # status-aware appointment sheet
├── client-details-sheet/
├── action-appointments/
├── analytics-dashboard/
└── quick-create-action/        # the "+" opener

src/features/                   # one user action each
├── auth-login/  auth-register/
├── onboarding/                 # step forms + wizard state
├── appointment-form/  appointment-checkout/
├── quick-create/               # appointment + time-off wizard (uses shared/lib/scheduling)
├── client-form/  client-delete/
├── service-form/  service-category-form/
├── payment-type-form/
├── profile-form/  contacts-form/  working-hours-form/  booking-settings-form/
├── notification-settings-form/  system-region-form/  account-settings/
└── time-block-form/

src/entities/                   # domain data + atoms  (see anatomy below)
├── session/  master/
├── service/  service-category/
├── client/  appointment/  time-block/
├── payment-type/  sale/  analytics/

src/shared/
├── api/
│   ├── supabase.ts             # RN-configured client (ONLY imported by entities/*/api)
│   ├── query-client.ts         # QueryClient + persistence (MMKV)
│   ├── database.types.ts       # generated Supabase types (recommended)
│   ├── errors.ts               # normalizeError
│   └── session-storage.ts      # secure session adapter (SecureStore/encrypted MMKV)
├── config/                     # env, currencies, date-formats, countries, feature-flags
├── lib/
│   ├── scheduling/             # PURE availability math + __tests__  (no entity imports)
│   ├── time-zone/              # Luxon UTC↔wall-clock helpers
│   ├── formats/                # time/price/date/duration formatters
│   ├── i18n/                   # i18next setup + locales (en, fr, ru)
│   ├── image/                  # resizeImageToSquare (expo-image-manipulator)
│   ├── permissions/            # native permission wrappers
│   └── analytics/              # track() facade
├── theme/                      # Unistyles tokens + themes (design system)
│   ├── tokens.ts               # primitive + semantic tokens (incl. palette.violet)
│   ├── themes.ts               # light/dark
│   └── unistyles.ts            # StyleSheet.configure (imported FIRST in _layout)
└── ui/                         # the UI kit primitives (Text, Button, Sheet, ListItem, states…)
```

### Entity anatomy (repeat for every entity)

```
entities/<entity>/
├── api/<entity>.api.ts         # supabase.from()/.rpc() — the ONLY supabase import site
├── model/
│   ├── types.ts                # domain + DTO types (or Zod schemas)
│   ├── <entity>.queries.ts     # TanStack hooks + keys + invalidation
│   ├── <entity>.store.ts       # Zustand store (only if needed, e.g. session)
│   └── <entity>.config.ts      # enums, palettes, status maps
├── ui/                         # entity atoms (ClientAvatar, StatusPill…)
├── lib/                        # entity-local pure helpers
└── index.ts                    # public API barrel
```

## 4. Placement decision rules

| You're adding… | It goes in… |
|---|---|
| A new screen / route | `src/app/(group)/name.tsx` (thin) |
| A composite block used by a screen | `src/widgets/<name>/` |
| A single user action (a form/flow) | `src/features/<name>/` |
| A Supabase call | `entities/<x>/api/<x>.api.ts` **only** |
| A query/mutation hook | `entities/<x>/model/<x>.queries.ts` |
| A domain type / DTO | `entities/<x>/model/types.ts` |
| An entity-specific visual atom | `entities/<x>/ui/` |
| A pure helper needing **two** entities | `src/shared/lib/<name>/` (never an entity) |
| A reusable design-system primitive | `src/shared/ui/<Component>/` |
| A token/color/spacing value | `src/shared/theme/tokens.ts` |
| App-wide constant/config | `src/shared/config/` |

## 5. Naming conventions

- **Files:** kebab-case for modules (`client.queries.ts`, `appointment.api.ts`); PascalCase for
  React components (`ClientAvatar.tsx`, `Button.tsx`).
- **Routes:** lowercase, hyphenated, matching Expo Router expectations; groups in `(parens)`.
- **Hooks:** `useXQuery`, `useCreateXMutation`, `useX` (store).
- **Types:** `PascalCase`; DTOs suffixed `Dto`; enums as string-literal unions + `const` maps.
- **Cache keys:** centralized `xKeys` objects per entity.
- **Barrels:** every slice exports through `index.ts`; import via aliases (`@entities/client`),
  never deep relative paths across slices.

## 6. Path aliases (tsconfig)

Extend the current `@/*` with layer aliases for clean, boundary-friendly imports:

```jsonc
"paths": {
  "@/*":          ["./src/*"],
  "@app/*":       ["./src/app/*"],
  "@widgets/*":   ["./src/widgets/*"],
  "@features/*":  ["./src/features/*"],
  "@entities/*":  ["./src/entities/*"],
  "@shared/*":    ["./src/shared/*"],
  "@/assets/*":   ["./assets/*"]
}
```

## 7. Enforcement

- `eslint-plugin-boundaries` (or `eslint-plugin-import` rules) to forbid upward/sideways imports
  and deep-path imports across slices.
- A lint rule forbidding `supabase` imports outside `entities/*/api/*`.
- A lint rule forbidding raw color/spacing literals outside `shared/theme`.
- `tsc --noEmit` + `expo lint` in CI (see [roadmap.md](./roadmap.md)).
