---
version: 1.1
date: 2026-08-26
category: practices
status: proposed
---

# State Management

> Version 1.1 · 2026-08-26 · [Practices](./)

> How the app splits **server state** (data that lives in the backend) from **client state**
> (data that lives only on the device). The split mirrors the web app, which already separates
> Pinia Colada (server) from Pinia stores (client). Mobile: **TanStack Query** (server) +
> **Zustand** (client) + **React Hook Form** (form state).

## 1. The three kinds of state

| Kind             | Owner                | Examples                                                                                                | Lifetime                                |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Server state** | TanStack Query cache | appointments, clients, services, sales, analytics, master profile/settings                              | Fetched, cached, revalidated, persisted |
| **Client state** | Zustand stores       | session snapshot, theme, active locale, master preferences view, ephemeral UI (open sheet, wizard step) | App session / persisted                 |
| **Form state**   | React Hook Form      | every create/edit form's in-progress fields + validation                                                | While the form is open                  |

**Rule:** never copy server data into Zustand. If it comes from the backend, it belongs in a query.
Zustand holds only what the backend doesn't own.

## 2. Server state — TanStack Query

- **Provider**: one `QueryClient` in `src/app/_layout.tsx`. Sensible defaults: `staleTime` per
  query type (lists ~30s, analytics longer), `retry` modest, `refetchOnWindowFocus`→ use
  `focusManager` wired to `AppState` (refetch when the app returns to foreground).
- **Hooks**: defined per entity in `model/*.queries.ts` (see [api-layer.md](./api-layer.md)).
- **Keys**: centralized `xKeys` objects; identical between query and invalidation. Port the web
  keys: `['appointments', userId, from, to]`, `['appointments-actionable', userId]`,
  `['appointment-day-counts', userId, from, to, tz]`, `['clients', userId]`, `['services', userId]`,
  `['service-categories', userId]`, `['payment-types', userId]`, `['sale-by-appointment', id]`,
  `['masterProfile', userId]`, `['masterPreferences', userId]`, `['analytics-v2', periodKey]`.
- **Invalidation graph** (port exactly):
  - appointment create/update/remove → invalidate `appointments`, `appointments-actionable`,
    `appointment-day-counts`.
  - complete sale → invalidate `appointments*` + `sale-by-appointment`.
  - service mutations → `services`; category delete → `service-categories` **and** `services`.
  - payment mutations → `payment-types`.
  - settings mutations → `masterProfile` / `masterPreferences`.
- **Optimistic updates**: favourite toggle, payment-active toggle, checkout status flip — via
  `onMutate` snapshot + `onError` rollback + `onSettled` invalidate.
- **Loading**: `isPending` → first-load skeleton; `isFetching` → subtle refresh indicator. Do not
  swap a populated list for a skeleton on background revalidation.

## 3. Client state — Zustand

Small, focused stores (one concern each). Persist with the `persist` middleware backed by MMKV.

### Session store (the important one)

Backs the auth/onboarding guard. Ports the web `session.store.ts` semantics **including the
auth-lock rule**:

```ts
// entities/session/model/session.store.ts (shape)
interface SessionState {
  session: Session | null;
  profile: SessionProfile | null; // { id, first_name, last_name, username, avatar_url, deactivated_at }
  isInitialized: boolean;
  isSyncing: boolean;
  sessionError: unknown | null;
  init(): Promise<void>; // idempotent; subscribe THEN getSession
  waitForReady(): Promise<void>; // awaits in-flight profile fetch
  refreshProfile(): Promise<void>;
  retry(): Promise<void>;
  signOut(): Promise<void>;
}
```

**Critical carry-over rules:**

1. Subscribe to `onAuthStateChange` **before** `getSession()` (don't miss refresh events).
2. The `onAuthStateChange` callback must be **synchronous** — never call `supabase.from()` or
   `getSession()` inside it; that deadlocks Supabase's internal auth lock. Defer the profile fetch
   with `setTimeout(0)` / a microtask escape.
3. Deduplicate profile loads per user and ignore stale responses by request id. `isSyncing` keeps
   protected branches on the restoration route while profile state settles.
4. Surface restoration failures as `sessionError`; the root exposes a retry route instead of
   flashing auth/onboarding UI.
5. `SIGNED_OUT` or a successful explicit sign-out clears local session/profile state.

The root router reads this store and declares mutually exclusive `Stack.Protected` branches. Guard
changes remove unavailable protected history. A deep-link return target stays in a root-scoped hook,
not in this store, because navigation intent is not durable client state. See
[Navigation Architecture](./architecture/navigation.md).

### Master preferences store

A derived, normalized view of `master_profile` + `master_settings` (`timeFormat`, `currency`,
`dateFormat`, `timeZone`, calendar prefs, `language`, `theme`). It feeds the format helpers and the
theme/locale. It is **hydrated from a query** (server state) but exposed as a store for cheap
synchronous reads by formatters — refresh it when settings mutations settle.

### Theme & locale stores

`theme` (auto/light/dark) drives Unistyles' adaptive theme; `locale` (en/fr/ru) drives i18next.
Both persist to MMKV and apply live (matching the web's "language/theme apply as you edit").

### Ephemeral UI

Wizard step + selections, open bottom sheet, transient toggles — either local `useState`/`reducer`
scoped to the flow (preferred for the quick-create wizard, like the web's scoped `reactive`), or a
tiny Zustand store when several components must coordinate.

## 4. Form state — React Hook Form + Zod

- Each form owns its state via `useForm({ resolver: zodResolver(schema) })`.
- Zod schemas double as DTO validators (replacing Joi) and can infer the DTO type.
- **Dirty tracking + unsaved-guard**: reproduce the web `useDirtyForm` pattern — seed from the
  query, diff against the last-saved snapshot, show the Save bar when dirty, and warn on navigate
  away. Don't clobber in-progress edits when a background refetch updates the underlying query.
- Settings sections that "save instantly" (payment methods, categories, booking master-switch)
  bypass the Save bar and call mutations directly.

## 5. Offline & persistence (phased)

- **Phase 1**: persist the TanStack Query cache to MMKV (`@tanstack/query-persist-client` +
  an MMKV persister). Wire `onlineManager` to `@react-native-community/netinfo`. Result:
  read-offline from cache, and mutations pause while offline and resume on reconnect.
- **Phase 3+ (only if needed)**: promote to `expo-sqlite`/`op-sqlite` as an offline-first source of
  truth with an explicit sync layer. Not required for MVP. Q-ARCH-4.
- Zustand `persist` (MMKV on native, `localStorage` on web) restores theme, locale, and other
  persisted client preferences. The Supabase session itself restores from the platform-specific
  session-storage adapter; the session Zustand store is not separately persisted.

## 6. State-restoration on cold start (sequence)

```
App launch
 → Unistyles theme loads (persisted theme store)
 → QueryClient created; cache rehydrated from MMKV (stale, will revalidate)
 → i18next loads persisted locale
 → session.init(): subscribe → getSession() (restores Supabase session from secure storage)
     → if session: fetch profile → guard resolves destination
     → else: guard → (auth)
 → queries revalidate in background as screens mount
```

## 7. Anti-patterns (do not)

- ❌ Putting fetched lists in Zustand "for convenience".
- ❌ Calling `supabase.from()` inside `onAuthStateChange`.
- ❌ Duplicating cache keys as string literals across files (use the `keys` objects).
- ❌ Invalidating on `onSuccess` only (use `onSettled`).
- ❌ Deriving "new client" / "last visit" / availability in components (use the shared pure helpers).
- ❌ Storing UTC-vs-local dates ambiguously (always convert through `shared/lib/time-zone`).
