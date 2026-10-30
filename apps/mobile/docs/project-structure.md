---
version: 2.2
date: 2026-08-30
category: architecture
status: implemented
---

# Project Structure

> Version 2.2 · 2026-08-30 · [Architecture](./architecture/)

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
├── _layout.tsx                 # providers + Stack.Protected session branches
├── session-restoring.tsx       # cold-start session/profile restoration
├── session-error.tsx           # retryable restoration failure
├── (auth)/
│   ├── _layout.tsx
│   ├── sign-in/index.tsx       # /sign-in
│   ├── sign-in/email.tsx       # /sign-in/email (email step)
│   ├── sign-in/code.tsx        # /sign-in/code (one-time code)
│   ├── language.tsx            # language form sheet
│   └── email.tsx               # legacy redirect
├── (onboarding)/
│   ├── _layout.tsx
│   ├── onboarding/             # index → profile → professions (one route per step)
│   └── welcome.tsx             # legacy redirect
├── (app)/
│   ├── _layout.tsx             # protected Stack: tabs + pushed screens + modal siblings
│   ├── analytics.tsx           # opened from "Сегодня", not a tab
│   ├── clients/[clientId].tsx  # client profile, pushed over the tab bar
│   ├── settings/               # profile, services — pushed over the tab bar
│   ├── (tabs)/
│   │   ├── _layout.tsx         # NativeTabs: Сегодня·Календарь·Клиенты·Меню + floating "+"
│   │   ├── (home)/             # nested Stack + canonical /
│   │   ├── (calendar)/         # nested Stack + /calendar
│   │   ├── (clients)/          # nested Stack + /clients
│   │   └── (settings)/         # nested Stack + /settings
│   └── (modals)/
│       ├── appointment-form.tsx
│       ├── checkout/[appointmentId].tsx
│       └── quick-create/       # fullscreen modal with its own Stack
├── (dev)/uikit/                # __DEV__ + protected living catalog
└── +not-found.tsx
```

Each screen file imports one or a few widgets/features and wires navigation. **No data fetching or
business logic beyond calling a widget.** See
[Navigation Architecture](./architecture/navigation.md) for route ownership, flow, and recipes.

## 3. `src/{widgets,features,entities,shared}`

> **Built vs planned.** The route scaffold in §2 (all five tab Stacks + the modal group) is
> already in place, but the composite widgets, features, and entities that back most of those
> screens are still stubs. The lists below mark what exists today (✅) versus what the roadmap
> will add (◻). Keep this split honest as slices land — it is the fastest way to see how far
> the product is from the navigation shell. See [roadmap.md](./roadmap.md) for phase ordering.

```
src/widgets/                    # composite, screen-level
├── ✅ uikit-catalog/           # the development-only /uikit living catalog
├── ✅ quick-create-flow/       # step scaffold for the quick-create modal
├── ✅ client-list/             # Phase 2 clients list (states + optimistic favourite)
├── ✅ client-details/          # Phase 2 client read + new/returning derivation
├── ✅ service-list/            # Phase 2 services list grouped by category
├── ◻ home/                     # greeting + overview + schedule timeline + actions
├── ◻ calendar/                 # native calendar (agenda/day/week)
├── ◻ appointment-preview-sheet/  # status-aware appointment sheet
├── ◻ client-details-sheet/
├── ◻ action-appointments/
└── ◻ analytics-dashboard/

src/features/                   # one user action each
├── ✅ auth-login/              # Welcome, email → code (OTP), gated social sign-in
├── ✅ language-select/         # app language form sheet (ru/en/fr, applies live)
├── ✅ onboarding/              # step screens, persisted draft store, complete_onboarding write
├── ◻ appointment-form/  appointment-checkout/
├── ◻ quick-create/            # appointment + time-off wizard (uses shared/lib/scheduling)
├── ◻ client-form/  client-delete/
├── ◻ service-form/  service-category-form/
├── ◻ payment-type-form/
├── ◻ profile-form/  contacts-form/  working-hours-form/  booking-settings-form/
├── ◻ notification-settings-form/  system-region-form/  account-settings/
└── ◻ time-block-form/

src/entities/                   # domain data + atoms  (see anatomy below)
├── ✅ session/                 # auth store + restoration (see state-management.md)
├── ✅ master/                  # profile/settings api + username query + config
├── ✅ service-category/  service/   # CRUD + optimistic active toggle (RLS user_id filter)
├── ✅ client/  appointment/  time-block/   # CRUD + derived (isNewClient, effective status, lastVisit)
└── ✅ payment-type/  sale/  analytics/     # seed cash/card; sale read-only; analytics RPC wrappers

src/shared/
├── api/
│   ├── supabase.ts             # RN-configured client (ONLY imported by entities/*/api)
│   ├── query-client.ts         # QueryClient + persistence (MMKV)
│   ├── database.types.ts       # generated Supabase types (recommended)
│   ├── errors.ts               # normalizeError
│   ├── session-storage.ts      # native: SecureStore key + encrypted MMKV
│   ├── session-storage.web.ts  # browser localStorage + SSR memory fallback
│   ├── storage.ts              # native non-secret MMKV
│   └── storage.web.ts          # browser/SSR non-secret storage
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
│   ├── queries.ts              # TanStack hooks + keys + invalidation (unprefixed)
│   └── <entity>.store.ts       # Zustand store (only if needed — e.g. session.store.ts)
├── config/                     # enums, palettes, status maps, seed constants (+ its tests)
├── ui/                         # entity atoms (ClientAvatar, StatusPill…)
├── lib/                        # entity-local pure helpers
└── index.ts                    # public API barrel
```

> **Actual naming (as built).** `model/queries.ts` is **not** prefixed with the entity name;
> a Zustand store **is** (`session.store.ts`). Constant/enum modules live in a sibling
> `config/` directory, not a `model/<entity>.config.ts` file — e.g.
> `entities/master/config/specializations.ts` and `config/time-format.ts` (with its
> co-located `time-format.test.ts`). `ui/` and `lib/` appear only when an entity needs them;
> `session` and `master` do not have them yet.

> **Query-hook convention (as built, Phase 2).** Because the import boundary forbids an
> entity importing a sibling entity, data hooks do **not** read the session store
> themselves — they take `userId` as their first argument and gate on it
> (`enabled: !!userId`). The calling widget/feature/screen resolves it once via
> `useUserId()` (from `@/entities/session`) and passes it down. Reads on the
> public-SELECT tables (`service`, `service_category`, `master_profile`) **must** filter
> `.eq('user_id', userId)` or they return other masters' rows. Cache keys are centralised
> per entity (`serviceKeys`, `clientKeys`, `appointmentKeys`, …); appointment writes
> invalidate the `['appointments', userId]` prefix plus `appointments-actionable`,
> `appointment-day-counts`, and `['analytics', userId]`.

## 4. Placement decision rules

| You're adding…                         | It goes in…                                |
| -------------------------------------- | ------------------------------------------ |
| A new screen / route                   | `src/app/(group)/name.tsx` (thin)          |
| A composite block used by a screen     | `src/widgets/<name>/`                      |
| A single user action (a form/flow)     | `src/features/<name>/`                     |
| A Supabase call                        | `entities/<x>/api/<x>.api.ts` **only**     |
| A query/mutation hook                  | `entities/<x>/model/<x>.queries.ts`        |
| A domain type / DTO                    | `entities/<x>/model/types.ts`              |
| An entity-specific visual atom         | `entities/<x>/ui/`                         |
| A pure helper needing **two** entities | `src/shared/lib/<name>/` (never an entity) |
| A reusable design-system primitive     | `src/shared/ui/<Component>/`               |
| A token/color/spacing value            | `src/shared/theme/tokens.ts`               |
| App-wide constant/config               | `src/shared/config/`                       |

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

These layer aliases are **implemented** in `tsconfig.json` today — use them for clean,
boundary-friendly imports (never deep relative paths across slices):

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
