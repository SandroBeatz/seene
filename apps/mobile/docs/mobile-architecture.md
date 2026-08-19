---
version: 1.0
date: 2026-08-19
category: architecture
status: proposed
---

# Mobile Architecture

> How the app is layered, where each kind of code lives, and the rules that keep it maintainable
> and backend-swappable. The concrete directory tree is in [project-structure.md](./project-structure.md);
> the data pipeline is in [api-layer.md](./api-layer.md); state split is in
> [state-management.md](./state-management.md).

## 1. Guiding principles

1. **Feature-Sliced Design (FSD-lite).** The same architecture the web app uses, so logic ports
   predictably: layers `app → widgets → features → entities → shared`, sliced by domain.
2. **Strict downward imports.** A layer may import only from layers **below** it. No sibling
   imports **within** a layer (feature ↔ feature, entity ↔ entity are forbidden). Cross-cutting
   logic that needs two entities lives in `shared` (e.g. the scheduling core needs appointments +
   time blocks).
3. **Public API per slice.** Every slice exposes an `index.ts` barrel; other code imports the
   barrel, never deep paths. This is what makes slices swappable and agent-navigable.
4. **UI / domain / data separation.** UI never talks to Supabase. Components call query hooks;
   hooks call api functions; api functions call Supabase. One direction, no shortcuts.
5. **Routes are thin.** `src/app/` (Expo Router) only wires screens to widgets/features and hosts
   navigators/guards. No business logic, no data fetching beyond calling a widget.
6. **Pure core is testable.** Availability math, formatters, mappers, and status derivation are
   pure functions in `shared/lib` with exhaustive unit tests.

## 2. Layers

```
┌──────────────────────────────────────────────────────────────────┐
│ app/           Expo Router routes, navigators, guards (THIN)      │
├──────────────────────────────────────────────────────────────────┤
│ widgets/       Composite, screen-level blocks: Calendar, Home,    │
│                AppointmentPreviewSheet, ClientDetailsSheet…        │
├──────────────────────────────────────────────────────────────────┤
│ features/      One user action each: appointment-form, checkout,  │
│                quick-create, auth-login, *-settings-form…          │
├──────────────────────────────────────────────────────────────────┤
│ entities/      Domain units: api/ (Supabase), model/ (types,      │
│                queries, store), ui/ (entity-specific atoms)        │
├──────────────────────────────────────────────────────────────────┤
│ shared/        api client, config, lib (scheduling, time-zone,    │
│                formats, i18n), theme (tokens), ui (design kit)     │
└──────────────────────────────────────────────────────────────────┘
        imports allowed downward only ↓   (never upward, never sideways)
```

| Layer | Contains | May import | Must NOT import |
|---|---|---|---|
| `app` | routes, `_layout`, guards | widgets, features, entities, shared | — |
| `widgets` | composite blocks | features, entities, shared | app, other widgets |
| `features` | single user actions | entities, shared | app, widgets, other features |
| `entities` | domain data + atoms | shared, **own** slice only | app, widgets, features, other entities |
| `shared` | framework-agnostic reuse | shared only | everything above |

Enforce with `eslint-plugin-boundaries` (recommended) so agents can't drift.

## 3. Entity anatomy (the heart of the data layer)

Each entity mirrors the web's proven shape:

```
entities/<entity>/
  api/<entity>.api.ts       # ⛔ the ONLY place `supabase` is imported (for this entity)
  model/
    types.ts                # domain + DTO types (or Zod schemas)
    <entity>.queries.ts     # TanStack Query hooks (keys, invalidation)
    <entity>.store.ts       # Zustand store, only if needed beyond queries
    <entity>.config.ts      # enums, palettes, status maps (typed constants)
  ui/                       # entity-scoped presentational atoms (e.g. ClientAvatar, StatusPill)
  lib/                      # entity-local pure helpers (no cross-entity!)
  index.ts                  # public API barrel
```

Ten entities to build (ported from web): `session`, `master`, `service`, `service-category`,
`client`, `appointment`, `time-block`, `payment-type`, `sale`, `analytics`.

## 4. Data flow (read + write)

**Read:**
```
Screen (app/) → Widget → useXQuery() [entities/x/model] → listX() [entities/x/api] → supabase.from()
                              ↑ TanStack cache (keyed, background-refetch, persisted to MMKV)
```

**Write (with cache invalidation):**
```
Feature form → useCreateXMutation() → createX() [api] → supabase → onSettled: invalidate ['x', userId]
```

**RPC (checkout / analytics):** same shape — the api function calls `supabase.rpc(...)`; the hook
wraps it. Optimistic updates (checkout status, favourite toggle, payment active) use TanStack
`onMutate`/`onError` rollback, matching the web behaviour.

Cache-key convention: `[entityName, ...identifiers]`, e.g. `['appointments', userId, from, to]`,
`['clients', userId]`, `['sale-by-appointment', appointmentId]`. Keep keys identical across query
and invalidation. See [state-management.md](./state-management.md).

## 5. Cross-cutting modules (in `shared`)

- **`shared/api`** — the Supabase client singleton (RN-configured), the `QueryClient`, error
  normalization (`normalizeError` mapping Postgres codes like `23505` → typed app errors), and
  (future) the network/online manager.
- **`shared/lib/scheduling`** — pure availability math (`findAvailableSlots`, `findFreeIntervals`,
  `hasAnyFreeSlot`, slot grouping, `classifyDayState`). Ported + unit-tested. **No entity imports.**
- **`shared/lib/time-zone`** — Luxon-backed UTC↔wall-clock conversions used everywhere times are
  shown or written.
- **`shared/lib/formats`** — time (12/24), price (currency), date (format), duration — reading the
  master preferences store.
- **`shared/lib/i18n`** — i18next setup + catalogs (en/fr/ru).
- **`shared/theme`** — Unistyles tokens + themes (see design-system.md).
- **`shared/ui`** — the design-system UI kit.
- **`shared/config`** — env, currencies, date-formats, countries, feature-flags.

## 6. Navigation & guards

- `src/app/_layout.tsx` initializes Unistyles (imported first), the `QueryClientProvider`,
  gesture-handler root, safe-area, Sentry, i18n, and the theme provider.
- **Auth/onboarding guard**: a root layout reads the session store (Zustand, backed by
  `onAuthStateChange`) and redirects using the decision table in
  [business-logic.md](./business-logic.md) §3. Route groups: `(auth)` (login/register),
  `(onboarding)` (steps), `(tabs)` (home/calendar/clients/analytics/settings). The guard awaits an
  in-flight profile fetch before deciding (port the web `_processingPromise`).
- Keep the guard in a layout, not per-screen.

## 7. Error handling

- **API layer** throws on Supabase error (like the web). Never returns raw Supabase objects.
- **Normalization**: `shared/api/normalizeError` maps known cases (duplicate phone `23505`, RPC
  `already_completed` / `appointment_not_found`) to typed errors with i18n keys.
- **Query layer**: TanStack surfaces `error`; screens render the design-system error state; toasts
  for mutation failures.
- **Global**: an error boundary + Sentry capture for unexpected crashes.

## 8. Feature flags, permissions, analytics hooks

- **Feature flags** — a simple typed config in `shared/config/feature-flags.ts` (e.g.
  `appleSignIn`, `offlineMode`, `productAnalytics`), read via a hook. Remote flags optional later.
- **Permissions** — native permission requests (notifications, camera/photos for avatar) wrapped in
  `shared/lib/permissions` with graceful denial states.
- **Product analytics** — a thin `track(event, props)` facade in `shared/lib/analytics` so call
  sites don't depend on the vendor; no-op until enabled.

## 9. What ports directly vs. what must be rebuilt

| Ports directly (logic identical) | Must be rebuilt for native |
|---|---|
| Entity types, DTOs, api functions (transport aside) | All UI / components (new design system) |
| Query/mutation structure & cache keys | Calendar (FullCalendar → native) |
| Scheduling/availability math | Charts (Chart.js → Skia lib) |
| Status maps, derived values, validators (Joi→Zod) | Navigation (Vue Router → Expo Router) |
| Auth/onboarding rules, guard decision table | Supabase client init (browser → RN adapters) |
| Formatting helpers, i18n catalogs | Overlays (web modals → bottom sheets) |
| Business rules & invariants | Forms (vue → RHF), state (Pinia → Zustand/TanStack) |

## 10. Non-negotiable rules (for humans and agents)

1. `supabase` is imported **only** inside `entities/*/api/*.api.ts`.
2. Import slices via their `index.ts` barrel — never deep paths.
3. No sibling imports within a layer; cross-entity logic goes to `shared`.
4. Routes in `src/app/` stay thin.
5. All visible text goes through i18n; all styling through theme tokens (no inline colors/spacing).
6. Times: store UTC, display/edit in master timezone via `shared/lib/time-zone`.
7. Server data lives in TanStack Query; Zustand holds only client state.
8. The pure scheduling core has unit tests before the wizard is wired.
