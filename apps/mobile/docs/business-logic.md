---
version: 1.0
date: 2026-08-19
category: business
status: draft
---

# Business Logic & Rules

> The domain rules the mobile app must preserve exactly. Distilled from the web app's
> `docs/business/*` and verified against the live database. Rules here are **binding** — they are
> not UI preferences and must not be reinvented per screen.

## 1. Core invariants

1. **Single role.** Every authenticated user is a master. All data is user-scoped by
   `user_id = auth.uid()` and isolated by RLS. There is no client login inside this app.
2. **A profile gate.** A master is not "ready" until a `master_profile` row exists. Until then the
   only reachable area is onboarding (see §3). This gate is enforced client-side by the nav guard.
3. **Times are UTC in the DB, wall-clock in the master's timezone in the UI.** `timestamptz`
   columns store UTC; every display/edit converts through the master's timezone (from
   `master_profile.schedule.timezone`). **Never compare raw dates across zones.**
4. **Money is per-master currency.** `price`/`amount` are `numeric`; the display currency comes
   from `master_settings.currency`. Values are stored as plain numbers, not minor units.
5. **The backend is swappable.** Business logic never sees Supabase — it goes through the data
   layer (see [api-layer.md](./api-layer.md)). This is an architectural rule with business intent:
   the company may replace Supabase later.

## 2. Entities & ownership

Seven domain concepts drive everything (plus sales as the money record):

- **Master** = `master_profile` (identity, address, `schedule`) + `master_settings` (preferences).
  1:1 with `auth.users`.
- **Service** + **ServiceCategory** — the catalog. A service belongs to ≤1 category (nullable).
- **Client** — address book entry; unique by `(user_id, phone)`.
- **Appointment** — one client + one or more services (`service_ids uuid[]`) at a time, with a
  status lifecycle.
- **TimeBlock** — unavailability; no client/service.
- **PaymentType** — accepted methods (system cash/card + custom).
- **Sale** + **SaleItem** — the immutable financial record created at checkout.

Relationships and delete rules are in [domain-model.md](./domain-model.md). The rules that matter
most to behaviour:

- **Client delete is `RESTRICT`** if they have any appointment. Delete/transfer appointments first.
- **Category delete is `SET NULL`** on its services — services survive, become uncategorised.
- **Appointment delete `CASCADE`s to its sale** (and sale_items). Deleting a completed appointment
  **erases revenue** — the UI must warn.
- **`service_ids` is denormalised** (no FK). A deleted service does not break historical
  appointments; the UI must resolve names at read time and show a fallback for missing ids.

## 3. Auth & onboarding

**Auth methods:** passwordless email code (Supabase email OTP, 6 digits, `shouldCreateUser`),
Google OAuth (active); Apple (planned, native flow required for iOS). The Supabase "Magic Link"
email template must contain `{{ .Token }}` so the email carries the code, and Redirect URLs must
include `appmasterseene://**` for OAuth. Phone OTP is **not** used by masters.

**Onboarding is a mandatory, linear 5-step wizard.** Data is held in local state and written in
one transaction at Step 5. The wizard creates `master_profile` and upserts `master_settings`.

| Step | Collects | Rules |
|---|---|---|
| 1 · Specializations | ≥1 category key from a fixed set of 9 | Stored as `text[]` of **keys** (`makeup`, `hair`, `nails`, `barber`, `massage`, `tattoo_piercing`, `depilation`, `cosmetology`, `brows_lashes`); display names come from i18n |
| 2 · Personal info | first/last name, phone (intl), **username** | `username` is globally unique → public URL; check via `check_username_available` RPC |
| 3 · Address & location | country (req.), street/house/zip/city (opt.), `place_id`, `works_at_place`, `can_travel` | Country auto-detected; also seeds `time_format` (US/CA/AU/IN… → 12h, else 24h). Address optionally via Google Places |
| 4 · Schedule & timezone | weekly `schedule`, timezone, time format | Per day: enabled + start/end + breaks[]. Timezone defaults to device zone |
| 5 · Review & create | — | Validate all → `INSERT master_profile` → `UPSERT master_settings`. Settings failure is non-fatal |

**Nav guard rules** (port the web `beforeEach` exactly):

| Session | Profile | Going to | Result |
|---|---|---|---|
| ✅ | `deactivated_at` set | anywhere | sign out → login (deactivated notice) |
| ❌ | — | auth routes | allow |
| ❌ | — | anything else | → login |
| ✅ | none | auth routes | → onboarding |
| ✅ | exists | auth routes | → home |
| ✅ | none | dashboard | → onboarding |
| ✅ | exists | dashboard/onboarding | allow |

**Session store rule (critical, carry over):** the Supabase `onAuthStateChange` callback must be
**synchronous** — never call `supabase.from()` / `getSession()` inside it, or you deadlock on the
auth lock. Defer profile fetches to the next macrotask. Guard navigation must await an in-flight
profile fetch before deciding (the web `_processingPromise` pattern). See
[state-management.md](./state-management.md).

## 4. Appointment lifecycle (state machine)

```
           create
             │
          pending ──[grace period]──► expired (background job)
         /       \
    confirm     cancel/decline
       │            │
   confirmed     cancelled
    /      \
 complete  no_show
    │
 completed  (─► creates a sale)
```

| Status | Meaning | Transitions |
|---|---|---|
| `pending` | Created, awaiting confirmation | → confirmed, cancelled, expired |
| `confirmed` | Master confirmed | → completed, cancelled, no_show |
| `completed` | Done; sale recorded | terminal |
| `cancelled` | Cancelled/declined | terminal |
| `no_show` | Client didn't appear | terminal |
| `expired` | Stale pending, auto-set | terminal |

- **Actionable** appointments (dashboard) = `status = 'pending'` **OR** (`confirmed` AND
  `start_at < now()`).
- **Declining** an online request = set `cancelled` (distinct from `expired`).
- **Effective status** (UI-only, never persisted): the mobile app should reproduce the web's
  derived `ongoing` (now inside the window) and `past` (confirmed, ended, not completed) states.
- **New client** is **derived**: `countClientAppointments(clientId) <= 1`.
- **Last visit** is **derived**: latest `completed`/`confirmed` appointment whose end
  (`start_at + duration`) is in the past; else `null`.

## 5. Checkout (money) — atomic, one appointment → one sale

Completing a `confirmed` appointment opens checkout. On confirm, the app calls the
**`complete_appointment` RPC** (never row-by-row inserts) which, in one transaction: verifies
ownership; rejects if already sold (`already_completed`); sets status `completed`; inserts one
`sale`; inserts one `sale_item` **per service, snapshotting name + price** at checkout time.

Rules:
- Available only for `confirmed` appointments.
- Amounts: single service → edit total; multiple → per-service amounts summed. All ≥ 0, total > 0.
- Payment type: pre-select the `is_default` method (else first active). No active methods →
  confirm disabled.
- Snapshots make sales **immutable** to later service edits.
- No refunds, partial payments, split billing, or deposits. "Not paid" is never shown; a completed
  appointment shows **Paid · amount**.
- Errors: `already_completed` → warning, close; other → error, stay open. Invalidate cache on
  `onSettled` (not just success) so stale `pending` never lingers.

## 6. Services & catalog

- Duration ∈ {15, 30, 45, 60, 90, 120} minutes (Joi-enforced on the web; keep the constraint).
- Price ≥ 0. Colour from a fixed 10-colour palette (default `#a78bfa`), used for calendar rendering.
- `is_active` soft toggle — inactive services are hidden from appointment selection but retained.
- Multi-service appointment: total duration & price are the **sum** of selected services, both
  manually overridable.
- Categories: user-managed (create inline or in settings), append-ordered by `sort_order`, delete
  is `SET NULL`.

## 7. Clients

- `phone` required and **unique per master** (`23505` on duplicate → localised "duplicate phone").
- Avatar = emoji on neutral bg, **or** deterministic pastel initials seeded by client `id`.
- `is_favorite` sorts favourites first; list groups **Favorites / Others**.
- `source` = `manual` (default) vs online origin → manual/online badge.
- Delete blocked while appointments exist (`RESTRICT`).

## 8. Payment types

- Two **system** methods (`kind` = `cash`/`card`) auto-seeded idempotently
  (`ensureSystemPaymentTypes`) — undeletable, only toggleable. Their display name/subtitle come
  from i18n, not the stored `name`.
- **Custom** methods (`kind = 'custom'`): name + colour from a fixed 10-colour palette; creatable,
  editable, reorderable (`sort_order`), deletable.
- `is_active` toggles availability at checkout (optimistic). `is_default` pre-selects at checkout
  (currently only set at seed/migration — no reassignment UI; a known gap to improve on mobile).

## 9. Working hours & availability math

- `master_profile.schedule` (jsonb) is the source of truth: `{ timezone, days: { monday..sunday:
  { enabled, start, end, breaks[] } } }`. Times are `HH:MM` 24h in the master's timezone.
- Availability computation is **pure minute math** and must be ported to a shared, unit-tested
  module (the web keeps it in `src/shared/lib/scheduling/`, deliberately **not** in an entity,
  because it needs both appointment and time-off data — FSD forbids entity↔entity imports).
  Functions: `findAvailableSlots` (step-grid slots that fit + are free), `findFreeIntervals`
  (merged gaps for time-off), `hasAnyFreeSlot`/day map (calendar day states).
- Inputs: working window for the weekday, busy = appointments (status not cancelled/no_show/
  expired) `[start, start+duration]` ∪ time blocks ∪ breaks, service duration, step
  (`calendar_slot_step_minutes`, default 15).
- **Master vs public differ:** the in-app master flow ignores `online_booking_enabled`,
  `booking_min_notice_minutes`, and `booking_buffer_minutes` (the master is trusted and may book
  any day/time, incl. the past). The public flow applies all three. The pure core takes them as
  options so both callers share one implementation.
- Past-day bookings are written as **`confirmed`** (they happened), then completed via checkout —
  never auto-`completed` (a completed appointment without a sale is inconsistent).

## 10. Online booking (context — not built in this app)

Masters configure booking behaviour in Settings (`online_booking_enabled`,
`booking_default_status`, `booking_buffer_minutes`, `booking_min_notice_minutes`). The public page
lives in the `seene` Nuxt site. Online bookings surface here as `appointments` with
`source = 'online_booking'` (and a `booking_default_status` of `pending`/`confirmed`). The mobile
app must **display** these correctly (tags, requests-to-confirm surface) but does not implement the
public flow. Server-side validation of public bookings is the Nuxt/RPC layer's responsibility.

## 11. Analytics (read-only, server-computed)

All metrics come from RPCs (`get_analytics_v2`, `get_analytics_widgets_v2`) — **no client-side
aggregation**. Two halves:
- **Filter-driven** (follow the period: Day/Week/Month/Year/Custom, optional Compare vs prior
  period): earned (`sale.paid_at`), appointments (completed by `start_at`), clients served
  (distinct), hours worked (Σ duration), avg check (earned/appointments), revenue series.
- **Fixed-window** (ignore the filter): top services (30d), client mix new/returning by lifetime
  completed-visit count (90d), busiest days + peak hour (56d).
- Week starts **Monday**. Deltas are `round((cur−prev)/prev×100)`; prev = 0 → "new" badge.
- Excluded everywhere: cancelled, no_show, pending, confirmed-not-completed; no refunds.

## 12. Settings (nine sections)

Profile · Contacts & social · Working hours · Booking · Payment methods · Service categories ·
Notifications · System & region · Account. Save UX varies by section: most use an explicit
dirty-tracked Save bar; Payment methods, Service categories, and the Booking master-switch persist
instantly; Account drives Supabase Auth directly. `master_settings` rows are **lazy** (created on
first write via upsert); reads fall back to `DEFAULT_*` constants. Timezone lives in
`schedule.timezone` even though it's edited under System & region. Full field-by-field map: see
[features.md](./features.md) and the web `docs/business/settings.md`.

## 13. Account lifecycle

Change email (Supabase secure double-confirm), change password (re-auth then update), sign out,
and **delete account** = soft-delete by stamping `master_profile.deactivated_at = now()` + sign
out. The guard then blocks any session whose profile is deactivated. Physical deletion 30 days
later is a planned scheduled job (not yet built).
