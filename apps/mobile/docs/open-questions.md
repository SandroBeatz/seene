---
version: 1.0
date: 2026-08-19
category: open-questions
status: living
---

# Open Questions, Risks & Assumptions

> Everything that could not be confirmed from code or the database, plus decisions that need the
> product owner. Each item is either a **question** (needs your answer), an **assumption** (what we
> proceeded with; correct us if wrong), or a **risk** (a hazard to manage). IDs are referenced from
> the other docs.

## A. Decisions needed from you (blocking or shaping)

### Q-DB-1 — `master_profile` is world-readable (privacy) — ✅ RESOLVED (accepted)
**Owner decision (2026-08-19):** public read of the master profile — **including phone and
address — is intentional**: clients need it to contact/find the master. Keep the public
`SELECT` policy as-is. No tightening for now.
*Follow-ups to keep in mind (not blocking):* (a) App/Play Store privacy disclosures must state
that master contact details are public; (b) if solo-master home-address safety ever becomes a
concern, we can later expose only `city` + hide exact street via a public view — but **not doing
this now** per owner.

### Q-DB-2 — How does a public `booking` become an `appointment`?
Both `create_booking` and `create_appointment_from_booking` RPCs exist; `bookings` is empty; some
`appointments` carry `source='online_booking'`. The exact flow (does `bookings` get used at all, or
do public bookings go straight to `appointments`? is there a master-side "requests to confirm"
inbox?) is unclear. **Question:** what is the intended online-booking → master pipeline, and does
the mobile app need a dedicated "incoming requests" surface beyond the calendar/actionable list?

### Q-DB-3 — Revoke `anon` EXECUTE on `complete_appointment`?
Security advisor flags `complete_appointment` as anon-executable (it checks `auth.uid()` internally,
so anon calls fail closed, but the grant is wrong). **Decision:** OK to revoke `anon` EXECUTE
(server-side change to the shared DB)? Low risk, recommended.

### Q-DB-4 — Enable leaked-password protection?
Auth advisor: HaveIBeenPwned check is disabled. **Decision:** enable it? (Improves security; may
reject some sign-ups with breached passwords.)

### Q-ARCH-1 — Type strategy — ✅ RESOLVED
**Owner decision (2026-08-19): generate types from the DB.** `supabase gen types typescript
--project-id foxqkomqtpbxyeqqwzpm` → `src/shared/api/database.types.ts`; type the client with it so
`from()/rpc()` calls are schema-checked and drift is caught at compile time. Domain/DTO types
(snake_case) derive from the generated Row types (or Zod schemas). No camelCase mapper layer for
now — can be added later if the domain diverges. Regenerate whenever the schema changes.

### Q-ARCH-2 — Secure session storage adapter — ✅ RESOLVED
**Owner decision (2026-08-19): encrypted MMKV.** Store the Supabase session in an MMKV instance
with an encryption key held in `expo-secure-store` (`react-native-mmkv` with `encryptionKey`).
No SecureStore 2KB limit; fast; and MMKV is reused for the TanStack Query cache persister and
Zustand `persist`. The Supabase client's `auth.storage` adapter wraps this MMKV instance.

### Q-UX-1 — Native calendar approach — ✅ RESOLVED
**Owner decision (2026-08-19):** use **`react-native-calendars`** (Wix,
https://wix.github.io/react-native-calendars/). We build the calendar with its `Agenda` /
`CalendarList` / `Timeline` components rather than a from-scratch calendar. `Timeline` covers the
day/week time-grid; `Agenda`/`CalendarList` cover month + list. Day-dot markers come from
`appointment_day_counts`. Still spike the `Timeline` drag/slot-tap interactions early in Phase 3;
appointment/time-block rendering + status colors map onto Timeline events.

### Q-UX-2 — Charting library for analytics
Chart.js can't be ported. **Decision:** `victory-native` (Skia) vs `react-native-gifted-charts` vs
another. Needed in Phase 5.

### Q-DS-1 — Design system final values
Engine (Unistyles), accent (Seene Violet), token structure, and governance are set. The **final
scales** (full color ramp, type sizes, spacing rhythm, radii, shadows), **icon set**, and **brand
font** await the dedicated design pass. **Question:** who provides these and in what form (Figma
tokens?) so we encode them once?

### Q-PROD-1 — Product analytics & which vendor?
Do we want product analytics (PostHog/Amplitude/none) for the mobile app? Affects Phase 0/6 and
privacy disclosures.

### Q-PROD-2 — Apple Sign In timing & Apple Developer account — ✅ RESOLVED
**Owner decision (2026-08-19):** no Apple Developer account yet. **Gate to Google-only**; put
Apple Sign In behind the `appleSignIn` feature flag (off). Revisit when the account exists (needed
before App Store submission if any social login is live — Apple review requires Sign in with Apple
alongside other social logins).

### Q-PROD-3 — Google Places dependency in onboarding/contacts — ✅ RESOLVED
**Owner decision (2026-08-19):** **no Google Places for now** — use plain manual address entry
(country select + free-text street/house/zip/city). Keep the data model's `place_id` column
nullable and unused; keep Places in mind as a later enhancement. This drops a billed API + native
setup dependency from the MVP.

### Q-PROD-4 — Currency & i18n scope
`master_settings.currency`/`date_format`/`time_format` exist but there's no payment processing —
currency is display-only. Confirm the supported currency list and that the three locales
(en/fr/ru) are the full set for launch.

## B. Assumptions we proceeded with (correct if wrong)

- **AS-1:** The mobile app is the **master app** only; it does **not** implement the public client
  booking flow, phone-OTP, `bookings`/`availability`/`otp_codes`, or the two booking RPCs — those
  stay in the `seene` Nuxt site. It only *displays* online bookings that arrived as `appointments`.
- **AS-2:** The Supabase schema is **read-only from this repo** for now; no migrations without your
  explicit approval (shared production DB with real data).
- **AS-3:** The web app's documented business rules are authoritative **except** where the live DB
  contradicts them (RLS public reads, booking RPCs, `appointments.duration NOT NULL`) — there, the
  DB wins (recorded in [database.md](./database.md)).
- **AS-4:** No design assets exist yet; we build the design-system foundation and grow it as design
  lands. We do **not** copy the web UI.
- **AS-5:** Prior "locked decisions" in agent memory (Unistyles 3, TanStack Query, Zustand, Expo
  Router, FSD-lite, Seene Violet) reflect your earlier intent and are adopted here, but the actual
  repo never contained that work — this plan builds it fresh.
- **AS-6:** The same Supabase project (`foxqkomqtpbxyeqqwzpm`) is used for dev and prod (the web app
  has no local/staging instance). We assume the mobile app also points at it initially — see RS-4.
- **AS-7:** Email confirmation stays disabled at launch (as on web); if enabled, we add a
  verify-email state.

## C. Risks to manage

- **RS-1 (timezone correctness):** scheduling is the app's core and is timezone-critical; Hermes
  `Intl` timezone data can be incomplete. Mitigation: Luxon + on-device verification in Phase 0
  (Q-ARCH-3), exhaustive unit tests on the scheduling core.
- **RS-2 (native calendar effort):** Q-UX-1 is the largest single build; underestimating it risks
  Phase 3. Mitigation: early spike.
- **RS-3 (Unistyles dev-build coupling):** the Babel plugin makes the app crash in Expo Go; the
  whole team must use dev builds and remember `--clear`. Mitigation: documented, dev build from
  Phase 0.
- **RS-4 (shared production DB):** ✅ **RESOLVED** — owner decision (2026-08-19): **stay on prod, no
  staging for now** (staging needs a paid plan). Mitigation we adopt instead: develop against
  **dedicated seeded test master accounts** (not the real ones), avoid destructive write-testing on
  live data, and be extra careful with any mutation testing. Revisit a staging project before scale.
- **RS-5 (no generated types today):** blind `as` casts hide schema drift. Mitigation: Q-ARCH-1
  (generate types).
- **RS-6 (SecureStore token size):** naïve SecureStore session storage fails silently on large
  sessions. Mitigation: Q-ARCH-2 adapter.
- **RS-7 (feature parity scope):** the web app is large (10 entities, 20 features, 12 widgets); a
  full port is multi-month. Mitigation: the phased roadmap sequences the core loop first; ruthless
  MVP scoping per phase.
- **RS-8 (default payment type unassignable):** inherited web gap — `is_default` can't be reassigned
  in UI. Mitigation: add a small "set default" affordance on mobile (improvement, not a blocker).
- **RS-9 (Google native OAuth setup):** native Google/Apple require correct client IDs, URL schemes,
  and EAS credentials; easy to misconfigure. Mitigation: verify in Phase 1 on real devices.

## D. Q-ARCH-3 — verify on-device timezone data (task, Phase 0)
Confirm Luxon + the RN environment resolve the IANA zones our masters use (Europe/*, America/*,
Asia/*) correctly on both iOS and Android before building scheduling. If gaps exist, bundle tz data.

## E. Q-ARCH-4 — offline depth
Is read-offline + queued writes (query-cache persistence) sufficient, or do we need true
offline-first editing (sqlite source of truth + sync)? Recommendation: cache-persistence for MVP,
revisit post-launch. **Confirm.**

---

### Resolution status (updated 2026-08-19)

**✅ Resolved:** Q-DB-1 (public profile intentional), Q-UX-1 (react-native-calendars),
Q-ARCH-1 (generate types), Q-ARCH-2 (encrypted MMKV), Q-PROD-2 (Apple gated off, Google-only),
Q-PROD-3 (manual address, no Places), RS-4 (stay on prod, use seeded test accounts).

**⏳ Still open (non-blocking for Phase 0/1):**
- **Q-DB-2** — intended online-booking → appointment pipeline + whether a "requests" inbox is needed.
- **Q-DB-3 / Q-DB-4** — server-side security tweaks (revoke `anon` EXECUTE on `complete_appointment`;
  enable leaked-password protection). Recommended; need your OK to touch the shared DB/Auth settings.
- **Q-DS-1** — final design-token values, icon set, brand font (from the design pass).
- **Q-ARCH-3** — verify on-device timezone data (a Phase 0 task, not a question).
- **Q-ARCH-4** — offline depth (recommend cache-persistence for MVP; confirm later).
- **Q-PROD-1** — product analytics vendor (or none) for MVP.
- **Q-PROD-4** — supported currency list; confirm en/fr/ru is the full launch locale set.

None of the open items block starting **Phase 0 (Foundation)**.
