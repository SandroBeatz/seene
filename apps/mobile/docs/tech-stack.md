---
version: 1.1
date: 2026-08-26
category: tech-stack
status: proposed
---

# Technology Stack

> Version 1.1 · 2026-08-26 · [Architecture](./architecture/)

> Recommended production stack for the Seene native app, with rationale, alternatives, and
> trade-offs. Anchored to what the repo already ships (Expo SDK 57) and to the web app's proven
> choices (Pinia Colada → TanStack Query, Pinia → Zustand). Verify every Expo/RN version against
> the installed `package.json` before use — **do not trust training data for Expo APIs**
> (`AGENTS.md`).

## Installed baseline

`expo ~57.0.16`, `expo-router ~57.0.16` (typed routes + React Compiler on), `react 19.2`,
`react-native 0.86.2`, `react-native-reanimated 4.5`, `react-native-gesture-handler 2.32`,
`react-native-screens`, `react-native-safe-area-context`, `expo-image`, `@expo/ui`,
`expo-glass-effect`, `expo-symbols`, `react-native-worklets`. Package manager: **bun**
(`bun.lock`); use `bunx expo ...` and `npx expo install <pkg>` for SDK-compatible versions.

## Decisions

### Platform — **Expo (managed, CNG) + EAS** ✅ already chosen

- **Why:** Continuous Native Generation (no hand-managed `ios/`/`android/`), EAS Build/Submit/Update
  (cloud builds, OTA), first-class TS, huge module ecosystem, fastest path for a small team.
- **Alternatives:** bare RN (more control, more ops burden); Flutter/native (throws away the web
  logic + team's TS knowledge). **Rejected.**
- **Trade-off:** native modules require a **dev build** (not Expo Go). Accept dev builds from day one.

### Language — **TypeScript (strict)** ✅

- `strict: true` already set. Non-negotiable for an AI-agent-friendly, refactorable codebase.

### Navigation — **Expo Router `~57.0.16`** ✅ already installed

- File-based routing in `src/app/`, typed routes, deep linking, native stack/tabs via
  `react-native-screens`. Route groups separate `(auth)`, `(onboarding)`, `(app)`, and `(dev)`;
  protected branches use `Stack.Protected`. Native Tabs are alpha in this release and isolated to
  one layout. See [Navigation Architecture](./architecture/navigation.md).
- **Alternative:** React Navigation directly (Expo Router is built on it; use it only if you need
  something Router can't express). **Keep Router.**
- **Trade-off:** keep `src/app/` **thin** — routes wire to widgets/features; no business logic.

### Server state — **TanStack Query v5** ✅

- **Why:** the web app's `@pinia/colada` is a near-direct analog; queries/mutations, cache keys,
  invalidation, background refetch, optimistic updates, and a persistence plugin for offline all
  map 1:1. The team already thinks in this model.
- **Mapping:** colada `useQuery/useMutation` → TanStack `useQuery/useMutation`; `useQueryCache().
invalidateQueries({key})` → `queryClient.invalidateQueries({queryKey})`; the `isPending` vs
  `isLoading` distinction → TanStack's `isPending` (no data yet) vs `isFetching` (any fetch).
- **Alternatives:** SWR (less feature-complete for mutations/offline); RTK Query (couples to Redux).
  **Rejected.**

### Client state — **Zustand** ✅

- **Why:** tiny, hook-based, no boilerplate; maps the web's small Pinia stores (session,
  master-preferences, locale, color-mode). Middleware for persistence + immer if needed.
- **Alternatives:** Redux Toolkit (overkill for this app's client state); Jotai (atom model is
  fine but Zustand matches the existing store mental model better); React Context (re-render cost).
  **Rejected.**
- **Rule:** server data lives in TanStack Query, **not** Zustand. Zustand holds only true client
  state (session snapshot, theme, active locale, ephemeral UI). See [state-management.md](./state-management.md).

### Forms & validation — **React Hook Form + Zod**

- **Why:** RHF is the RN-standard, uncontrolled, minimal-re-render form lib; Zod gives runtime
  validation **and** static type inference — it can define DTO schemas that double as the app's
  types (replacing the web's hand-written Joi + separate interfaces).
- **Alternatives:** Formik (heavier, more re-renders); keep Joi (no type inference, extra dep).
  **Rejected.** Zod also pairs with generated Supabase types for end-to-end safety.
- **Trade-off:** two libs to learn; worth it for the validation-as-types win.

### Data layer / API — **repository pattern (hand-rolled), Supabase behind it**

- Not a library — an architectural rule (see [api-layer.md](./api-layer.md)). `supabase` is
  imported **only** in `entities/*/api/*.api.ts`. Everything else calls query hooks.

### Backend SDK — **`@supabase/supabase-js` v2** (+ RN adapters)

- Requires RN-specific init: a storage adapter, `AppState`-driven `autoRefreshToken`,
  `persistSession: true`, `detectSessionInUrl: false`. See [api-layer.md](./api-layer.md).

### Secure storage — **expo-secure-store** (auth tokens) + **react-native-mmkv** (fast KV)

- **Why:** Supabase's session must persist in the OS keychain/keystore, not AsyncStorage.
  **Caveat:** SecureStore has a ~2KB value limit and Supabase sessions can exceed it → use a
  **Implemented:** native stores the session in encrypted MMKV and keeps only its 32-byte key in
  SecureStore. Web uses `localStorage`; static rendering uses isolated memory. MMKV is also the
  native fast KV for TanStack Query persistence and Zustand persist.
- **Alternatives:** AsyncStorage (not secure for tokens); plain MMKV without encryption (tokens at
  rest). **Decide the exact adapter in Phase 0** — Q-ARCH-2.

### Local DB / offline — **TanStack Query persistence (MMKV) now; expo-sqlite later if needed**

- Phase 1: persist the query cache to MMKV + `onlineManager` via `@react-native-community/netinfo`
  - paused mutations. This alone gives read-offline + queued writes for most flows.
- Phase 3+: if true offline-first is required (editing without connectivity across sessions),
  add `expo-sqlite`/`op-sqlite` as the source of truth with a sync layer. **Not** day one.

### Styling & theming — **react-native-unistyles 3**

- **Why:** token-driven styling engine with **adaptive light/dark themes**, C++/Nitro-fast, no
  re-render on theme change, variants, and breakpoints — ideal for a design-token-first system
  (see [design-system.md](./design-system.md)). Themes defined once; components consume tokens.
- **Alternatives:** NativeWind (Tailwind-in-RN — familiar from the web's Tailwind, but utility
  strings fight a strict token system and are harder for agents to keep consistent); Tamagui
  (powerful but heavy, opinionated compiler); StyleSheet + Context (manual theming, re-renders).
  **Unistyles chosen** for token discipline + performance.
- **Trade-off (important):** Unistyles' Babel plugin makes styled components require the native
  Unistyles/Nitro module → **the app must run as a dev build, will crash in Expo Go.** Start Metro
  with `--clear` after adding the plugin. This is an accepted consequence of choosing dev builds.

### UI Kit — **custom, built on Unistyles primitives** (+ a few vetted libs)

- Own the design language; do not adopt a heavyweight kit that dictates look. Compose primitives
  (Text, Button, Input, Switch, Card, Sheet, ListItem…) from tokens. See design-system.md.
- Vetted building blocks: **@gorhom/bottom-sheet** (sheets/modals), **@shopify/flash-list**
  (lists), **expo-image** (images), **react-native-reanimated** (motion),
  **react-native-gesture-handler** (gestures), **expo-haptics** (feedback).

### Lists — **@shopify/flash-list**; **Images** — **expo-image** (installed)

- FlashList for clients, services, calendar agenda, analytics rows — recycling for 60fps on long
  lists. expo-image for avatars/thumbnails with caching + WebP.

### Animations & gestures — **reanimated 4 + gesture-handler** (installed)

- Drives sheets, the calendar interactions, transitions, and micro-interactions.

### Charts (analytics) — **victory-native (Skia)** or **react-native-gifted-charts**

- Web's Chart.js can't be ported. Pick one Skia-based/perf charting lib in the analytics phase — Q-UX-2.

### Calendar UI — **`react-native-calendars` (Wix)** ✅ decided

- FullCalendar (web) is DOM-only and **must not** be ported. Use `react-native-calendars`:
  `Timeline` for day/week time-grid, `Agenda`/`CalendarList` for month + list, `markedDates` for
  day dots (`appointment_day_counts`). Map appointments/time-blocks → Timeline events with
  status colors. Spike the Timeline slot-tap/drag interactions early in Phase 3.
- **Address input:** **no Google Places for MVP** — manual entry (country select + free-text
  fields); `place_id` stays nullable/unused. Places is a later enhancement (Q-PROD-3).

### i18n — **i18next + react-i18next + expo-localization**

- Three locales (en/fr/ru) to match web. `expo-localization` for device locale; persist the choice
  (MMKV). Port the web message catalogs. All visible strings translated (hard rule).

### Dates & timezones — **Luxon** (or Temporal polyfill)

- **Why it matters:** scheduling is the app's core and is timezone-critical. Hermes ships `Intl`
  but **timezone data completeness varies by platform/version** — do not rely on ad-hoc `Date`
  math. Luxon gives reliable IANA zone conversions; wrap it in `shared/lib/time-zone` mirroring the
  web helpers (`getCalendarDateTimeString`, `toUtcIsoFromZonedDateTime`, etc.). Confirm zone data
  on-device early — Q-ARCH-3.
- **Alternatives:** date-fns-tz (fine, slightly more manual), day.js (tz plugin is weaker),
  Temporal (future-proof but polyfill weight). **Luxon** as the pragmatic default.

### Notifications — **expo-notifications** (+ EAS credentials)

- The app already models notification preferences. Push for master alerts (new booking, awaiting
  confirmation, cancellation, upcoming) + local notifications. **Reminders to clients** are
  WhatsApp-based and server-side, not device push. Phase 4+.

### Error monitoring — **Sentry (`@sentry/react-native`)** via Expo plugin

- Crashes, JS errors, performance, release health, source maps through EAS. Set up in Phase 0 so
  early builds are observable.

### Analytics (product) — **PostHog RN** (optional) or defer

- If product analytics is wanted, PostHog is Expo-friendly and privacy-configurable. Not required
  for MVP — Q-PROD-1.

### Testing — **jest-expo + @testing-library/react-native**, **Maestro** for E2E

- Unit: the **pure scheduling core** and formatters (highest ROI — exhaustive edge cases).
- Component: wizard step gating, form validation, status-driven preview.
- E2E: Maestro flows (login → onboarding → create appointment → checkout). Expo-recommended.
- **Alternatives:** Detox (heavier setup). Start with Maestro.

### Lint & format — **ESLint (eslint-config-expo) + Prettier**

- Match the repo's `expo lint`. Optionally add import-boundary linting (eslint-plugin-boundaries)
  to enforce FSD layer rules for agents. Prettier for format.

### CI/CD & release — **EAS Build / Submit / Update + GitHub Actions**

- GitHub Actions: typecheck + lint + test on PR. EAS: dev/preview/production build profiles,
  `eas submit` to stores, `eas update` for OTA JS pushes. Run EAS as `bunx eas-cli`.

## Stack at a glance

| Concern           | Choice                                  | Key alternative (why not)  |
| ----------------- | --------------------------------------- | -------------------------- |
| Platform          | Expo + EAS                              | bare RN (ops burden)       |
| Language          | TypeScript strict                       | —                          |
| Navigation        | Expo Router `~57.0.16`                  | React Navigation raw       |
| Server state      | TanStack Query v5                       | SWR / RTK Query            |
| Client state      | Zustand                                 | Redux Toolkit (overkill)   |
| Forms             | React Hook Form + Zod                   | Formik / Joi               |
| Backend SDK       | supabase-js v2 (+ RN adapters)          | —                          |
| Secure storage    | expo-secure-store + encrypted MMKV      | AsyncStorage (insecure)    |
| Offline           | Query persistence (MMKV) → sqlite later | sqlite day-one (premature) |
| Styling           | react-native-unistyles 3                | NativeWind / Tamagui       |
| UI kit            | custom on Unistyles                     | heavyweight kit            |
| Lists / images    | FlashList / expo-image                  | FlatList                   |
| Motion / gestures | reanimated 4 / gesture-handler          | —                          |
| Keyboard          | react-native-keyboard-controller        | KeyboardAvoidingView (differs on Android edge-to-edge) |
| Icons / vectors   | react-native-svg (design SVG paths)     | Ionicons (doesn't match the design) |
| Fonts             | Inter + Inter Tight via expo-font plugin | system font (iOS ≠ Android) |
| Charts            | victory-native (Skia)                   | Chart.js (web-only)        |
| Calendar          | react-native-calendars (Wix)            | FullCalendar (DOM-only)    |
| i18n              | i18next + expo-localization             | —                          |
| Dates/tz          | Luxon                                   | date-fns-tz / Temporal     |
| Notifications     | expo-notifications                      | —                          |
| Errors            | Sentry                                  | —                          |
| Testing           | jest-expo + RNTL + Maestro              | Detox                      |
| CI/CD             | EAS + GitHub Actions                    | Fastlane raw               |
