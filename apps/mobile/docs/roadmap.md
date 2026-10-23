---
version: 1.3
date: 2026-08-30
category: roadmap
status: proposed
---

# Implementation Roadmap

> Version 1.3 · 2026-08-30 · [Architecture](./architecture/)

> A phased plan from the current stock template to a production app. Each phase has a goal, a
> concrete deliverable set, and an exit criterion. **Phase 0 is the "first stage"** the brief asks
> for — after it, feature work can begin in earnest. Do not start mass screen-building before
> Phase 0 is done.

## Current state

**Phase 0 is built (2026-08-19); Phase 1 core is built (2026-08-24).** The stock template was
replaced with the FSD-lite skeleton, tooling, data/state plumbing, the Unistyles design system +
seed UI kit, i18n, the timezone/format core (with tests), Sentry, and CI. The production navigation
foundation and development-only UIKit catalog were completed on 2026-08-26. Since then (through
2026-08-30) the navigation chrome was polished: theme-aware gradient headers on every tab/modal
Stack (`NavigationHeaderBackground`), native Liquid-Glass header actions, and the
[Liquid Glass iOS](./liquid-glass-ios.md) skill + `GlassSurface` primitive with an older-iOS
fallback. `tsc --noEmit`, `expo lint`, and the Jest suite pass; `expo-doctor` is 21/21; iOS,
Android, and static web exports build. See the Phase 0 status box below.

**Where the code actually stands.** The full route scaffold (five tab Stacks + the modal group) is
in place. **Phase 2 landed the whole data layer** (2026-08-30): all eight entities, the cache-key
+ invalidation graph, and minimal clients/services list screens (see
[project-structure.md §3](./project-structure.md) for the built-vs-planned split). Most product
screens (calendar, checkout, home, analytics dashboard, richer forms) are still stubs — that is
**Phase 3+**. Remaining Phase 0/1/2 carry-over: run the native dev build on a device/simulator,
verify on-device timezone data (Q-ARCH-3), and exercise the auth/onboarding flows and the new
entity reads/writes end-to-end on hardware.

---

## Phase 0 — Foundation (the first stage) ✅ built (native dev-build boot pending)

> **Status (2026-08-19).** Done: FSD skeleton; tsconfig layer aliases; ESLint flat config with
> `eslint-plugin-boundaries` v7 (downward-only, same-slice-only) + the "no supabase outside an
> entity api file" guard + the "no raw color literals in UI layers" guard (all verified firing);
> Prettier; babel (Unistyles plugin, `root: 'src'`); Supabase RN client + encrypted-MMKV session
> adapter + generated `database.types.ts`; QueryClient + MMKV persistence + focus/online managers;
> Zustand theme/locale stores; Unistyles tokens + light/dark themes (Seene Violet) + seed kit
> (`Text, Button, IconButton, Icon, Input, Switch, Card, ListItem, Divider, Badge/StatusPill, Chip,
Sheet, Modal, Screen` + `Skeleton/EmptyState/ErrorState`); the development-only `/uikit` catalog; i18next
> (en/fr/ru); `shared/lib/time-zone` + `shared/lib/formats` (11 passing tests) with a
> `verifyTimeZoneData` Q-ARCH-3 guard; Sentry + root error boundary; GitHub Actions CI.
> **Pending:** `npx expo run:ios|android` native dev-build boot on hardware (needs Xcode/Android
> Studio — not runnable in this environment); run `verifyTimeZoneData()` on-device (Q-ARCH-3);
> fill `.env.local` from `.env.example` with the Supabase publishable key.

**Deliverables**

1. **Tooling & config:** bun scripts; ESLint (expo) + Prettier; `eslint-plugin-boundaries` +

**Goal:** a runnable dev build with the architecture, tooling, data plumbing, theming, and a seed
UI kit in place — but no product features yet. Everything later plugs into this.

**Deliverables**

1. **Tooling & config:** bun scripts; ESLint (expo) + Prettier; `eslint-plugin-boundaries` +
   the "no supabase outside api", "no raw style literals" rules; strict TS; path aliases
   (`@shared`, `@entities`, …); env via `EXPO_PUBLIC_*` + `app.config` typing.
2. **Dev build:** switch off Expo Go; `npx expo run:ios` / EAS dev profile; confirm it boots.
3. **FSD skeleton:** create `src/{app,widgets,features,entities,shared}` with barrels; move the
   template's screens out; a placeholder tabbed shell.
4. **Supabase (RN):** `shared/api/supabase.ts` with the RN adapters (secure session storage,
   AppState auto-refresh, `detectSessionInUrl:false`); decide the SecureStore/MMKV session adapter
   (Q-ARCH-2); generate `database.types.ts`.
5. **State infra:** `QueryClient` + MMKV persistence + `focusManager`/`onlineManager`; Zustand set
   up; error normalization.
6. **Design system core:** Unistyles tokens + light/dark themes (Seene Violet); seed UI kit
   (`Text, Button, IconButton, Input, Switch, Card, ListItem, Avatar, Badge/StatusPill, Chip,
Divider, Sheet, Modal` + `Skeleton/Empty/Error` states); a development-only `/uikit` catalog.
7. **i18n:** i18next + expo-localization + en/fr/ru catalogs (ported), locale store.
8. **Time/format core:** `shared/lib/time-zone` (Luxon) + `shared/lib/formats`, with tests; verify
   on-device timezone data (Q-ARCH-3).
9. **Observability:** Sentry wired; a root error boundary.
10. **CI:** GitHub Actions running `tsc --noEmit`, `expo lint`, unit tests on PR.

**Exit criteria:** dev build runs on iOS + Android; a demo screen renders kit components in
light/dark and all states; a trivial authenticated Supabase query works end-to-end through the
api→query→hook pipeline; CI is green.

---

## Phase 1 — Auth & onboarding 🚧 core built (2026-08-24)

> **Status (2026-08-24).** Built & green (`tsc`, `expo lint`, `jest` 18/18, `expo export --platform
ios` bundles): `session` entity (api + Zustand store honouring the auth-lock rules + auth mutations);
> `master` entity (username-availability query, `master_profile` insert, `master_settings` upsert,
> specialization keys, country→time-format seed); `features/auth-login` (email+password with a
> sign-in/create-account toggle, native Google behind the `googleSignIn` flag, Apple gated off);
> `features/onboarding` (the full 5-step wizard with per-step gating and the single Step-5 write);
> the root-layout `Stack.Protected` auth/onboarding branches implementing the §3 decision table
> (splash held until the session resolves). i18n `auth`/`onboarding` catalogs added for en/fr/ru; jest `@/` moduleNameMapper
> added. **Pending:** native dev-build boot to exercise the flows on device (Google OAuth round-trip,
> Supabase writes end-to-end); native pickers for country/timezone/time (MVP uses text inputs +
> two-letter country code); the "deactivated" login notice copy; wiring `master_settings`
> calendar/booking defaults (Phase 2+).

**Goal:** a master can sign up/in and complete onboarding into a real `master_profile`.

**Deliverables:** `session` entity (store with the auth-lock rules + guard); `(auth)` screens
(email+password, native Google; **Apple gated off** behind the `appleSignIn` flag — no Apple
account yet); the nav guard + decision table; `master` entity (profile/settings api + queries +
preferences store); the 5-step onboarding wizard writing `master_profile` + upserting
`master_settings`; username availability via `check_username_available`; device-timezone default;
**manual address entry (no Google Places)**.

**Exit criteria:** new user → onboarding → home; returning user → home; deactivated → blocked;
guard matches the decision table; session restores on cold start.

---

## Phase 2 — Core data entities (data layer, minimal UI) ✅ built (2026-08-30)

> **Status (2026-08-30).** Built & green (`tsc`, `expo lint`, `jest` 45/45): all eight entities —
> `service-category`, `service`, `client`, `appointment`, `time-block`, `payment-type`, `sale`
> (read-only), `analytics` (thin RPC wrappers) — with api + queries + types + config, centralised
> cache keys, the invalidation graph, and optimistic toggles (service/payment active, client
> favourite). `ensureSystemPaymentTypes` seeds cash/card idempotently. Foundations landed first:
> `useUserId()`, `shared/config/palettes`, and the **userId-as-argument** hook convention (entities
> can't import a sibling entity). RLS reads on public-SELECT tables filter `user_id`. Minimal UI
> proves the pipeline: the clients tab (`client-list` + `client-details` widgets, states +
> optimistic favourite + new/returning derivation) and a services list under settings
> (`service-list`, grouped, optimistic active toggle). Derived values are unit-tested
> (`isNewClient`, `getEffectiveAppointmentStatus`, `isActionable`, `lastVisitDate`, totals,
> `isSystemPaymentType`). `errors.ts` gained `has_related_records` (23503) for RESTRICT deletes.
> **Pending:** exercise reads/writes against the live DB on a native build; richer forms and the
> remaining screens are Phase 3+.

**Goal:** all master-app entities have api + queries + types, exercised by simple lists.

**Deliverables:** `service`, `service-category`, `client`, `appointment`, `time-block`,
`payment-type`, `sale`, `analytics` entities ported (functions, keys, invalidation graph,
optimistic handlers). `ensureSystemPaymentTypes`. Basic list screens for clients & services to
prove the pipeline. Unit tests for derived values (new client, last visit, effective status).

**Exit criteria:** every entity reads/writes through the layer with correct RLS scoping and cache
invalidation; no `supabase` import exists outside `entities/*/api`.

---

## Phase 3 — Calendar, appointments & checkout (the core loop)

**Goal:** the daily create→confirm→complete→pay loop works natively.

**Deliverables:** native **calendar** (agenda/day/week; day counts via `appointment_day_counts`);
appointment **preview sheet** (status-aware); appointment **form** (create/edit/delete, auto
totals, tz-aware); **checkout** via `complete_appointment` RPC (payment selection, optimistic
status). Port `shared/lib/scheduling` **with exhaustive unit tests** first.

**Exit criteria:** create an appointment, confirm it, complete + record a sale; calendar reflects
changes; scheduling math is fully tested.

---

## Phase 4 — Quick-create wizard, clients, services, settings

**Goal:** the fast-create flow and the management surfaces.

**Deliverables:** **quick-create** appointment + time-off wizard (availability-aware, past-day →
confirmed) with component tests; **clients** (list, details sheet, form with emoji avatar + intl
phone + duplicate handling, delete); **services & categories** (list, form, inline category
create); all **settings** sections (profile+avatar pipeline, contacts, working-hours, booking,
payment methods, service categories, notifications, system & region, account incl. soft-delete).

**Exit criteria:** a master can run their whole business config + book in ~20–30s from home.

---

## Phase 5 — Home dashboard & analytics

**Goal:** business insight surfaces.

**Deliverables:** **home** (greeting, overview metrics with Day/Week/Month, schedule timeline,
action appointments); **analytics** dashboard (period toolbar + compare, stat cards, revenue chart
via a Skia chart lib, three fixed-window widgets) from `get_analytics_v2` /
`get_analytics_widgets_v2`; period persistence.

**Exit criteria:** metrics match the web app for the same account/period; charts perform smoothly.

---

## Phase 6 — Notifications, offline & polish

**Goal:** production hardening.

**Deliverables:** push (`expo-notifications`) for master alerts + local reminders; offline
(query-cache persistence + paused mutations + offline UI); accessibility pass (targets, contrast,
dynamic type, screen reader, reduce-motion); performance pass (FlashList tuning, image caching,
cold-start); empty/error polish; deep links.

**Exit criteria:** works read-only offline with queued writes; a11y checklist passes; no jank on
long lists.

---

## Phase 7 — Release

**Goal:** ship to stores.

**Deliverables:** EAS production build profiles; store assets, privacy disclosures (note the
public master_profile read policy — Q-DB-1), app icons/splash; `eas submit` to App Store + Play;
`eas update` OTA channel; crash/vitals monitoring dashboards; a light E2E suite (Maestro:
login→onboarding→create→checkout).

**Exit criteria:** approved builds live; OTA pipeline verified; monitoring in place.

---

## Cross-phase workstreams

- **Testing** grows with each phase (pure core first, then components, then E2E).
- **i18n** keys added alongside every feature (never hardcode text).
- **Design tokens** refined as the design pass lands (Q-DS-1); screens consume tokens so refinement
  is centralized.
- **Docs** updated per phase (keep this set current — it's the agent/dev handoff).

## Sequencing notes

- Phases 0→1→2→3 are strictly ordered (each depends on the prior). 4/5 can partly parallelize once
  2/3 land. 6/7 are hardening/release.
- The two biggest "must-rebuild" risks (native calendar, charts) are isolated to Phases 3 and 5 —
  spike them early if capacity allows.
