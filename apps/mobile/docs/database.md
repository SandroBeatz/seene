---
version: 1.0
date: 2026-08-19
category: database
status: verified-against-live-db
---

# Database (Supabase) — Verified

> Project `foxqkomqtpbxyeqqwzpm` · region `ap-southeast-1` (Singapore) · Postgres + RLS.
> This document was produced by introspecting the **live** database on 2026-08-19 and
> reconciling it against the web app's `docs/business/*`. Where the live DB and the web docs
> disagree, **the live DB wins** and the discrepancy is called out.

## 1. Tables — the full picture (13 tables)

The web app's `data-model.md` documents **7** tables. The live database has **13**. The extra
six fall into two groups:

**Master-app tables (this mobile app owns these) — 10:**

| Table | Rows* | Purpose |
|---|---|---|
| `master_profile` | 2 | Master identity, contact, address, weekly `schedule` (jsonb), soft-delete |
| `master_settings` | 2 | Per-master preferences (calendar, booking, notifications, region) |
| `service_category` | 2 | Optional grouping for services |
| `service` | 0 | Services offered (duration, price, colour) |
| `client` | 18 | Client address book |
| `appointments` | 150 | Bookings (client + services + time + status) |
| `time_block` | 9 | Unavailability blocks on the calendar |
| `payment_type` | 7 | Accepted payment methods (cash/card system + custom) |
| `sale` | 131 | One financial record per completed appointment |
| `sale_item` | 148 | Per-service line snapshots within a sale |

**Public-booking tables (owned by the `seene` Nuxt site, NOT this app) — 3:**

| Table | Rows* | Purpose |
|---|---|---|
| `bookings` | 0 | Public self-booking requests (keyed to `master_profile.id`, phone-based) |
| `availability` | 0 | Alternative availability model for the public page (`day_of_week`/`specific_date`) |
| `otp_codes` | 53 | Phone OTP verification for public booking; RLS on, **no policies** (service-role only) |

*Row counts are a 2026-08-19 snapshot from production.

> The canonical column-level schema for the 10 master-app tables is in the web repo's
> `docs/business/data-model.md`, `payment-types.md`, and `checkout.md`. Rather than duplicate
> every column here, [domain-model.md](./domain-model.md) captures the TypeScript shapes the
> mobile app will use, and this file records the **DB-level truths and discrepancies** that the
> mobile team must not get wrong.

## 2. Verified truths that differ from / extend the web docs

### 2.1 RLS is **not** "authenticated-only" — public read policies exist ⚠️

The web `data-model.md` "Security model summary" states: *"There are no public (unauthenticated)
read policies; all access requires a valid Supabase auth session."* **This is false in the live
DB.** The public booking site added anon-readable policies:

| Table | Policy | Effect |
|---|---|---|
| `master_profile` | `Public can read master profiles` — `SELECT USING (true)` | **Anyone (anon) can read every master profile** |
| `service` | `Public can read services` — `SELECT USING (true)` | Anyone can read all services |
| `service_category` | `Public can read service categories` — `SELECT USING (true)` | Anyone can read all categories |
| `availability` | `Anyone can view availability` — `SELECT USING (true)` | Anyone can read availability |
| `bookings` | `Anyone can create bookings` — `INSERT WITH CHECK (master exists)` | Anyone can insert a booking |

Writes remain owner-scoped. On `master_profile` the single `FOR ALL` policy the web docs
describe has been **split** into: public `SELECT`, plus own-row `INSERT` / `UPDATE` / `DELETE`
(`auth.uid() = user_id`).

**Privacy implication (risk):** `master_profile` exposes `phone`, `address`, `house_number`,
`zip_code`, `place_id`, and `contact_email` to unauthenticated clients. Some fields are meant to
be public (name, `username`, `city`, `specializations`, `avatar_url`, `bio`, socials); **exact
address + phone likely are not.** See [open-questions.md](./open-questions.md) Q-DB-1.

The remaining master-app tables (`appointments`, `client`, `time_block`, `payment_type`, `sale`,
`sale_item`, `master_settings`) are correctly owner-scoped `auth.uid() = user_id` (sale_item via
an `EXISTS` subquery on its parent sale). The mobile app relies on this: **no per-row auth logic
is needed in the client** — RLS enforces isolation.

### 2.2 Public booking IS partially built at the DB level ⚠️

The web `online-booking.md` says the public flow "does not exist yet." At the **database** level
it partially does, consumed by the `seene` Nuxt site:

- Tables `bookings`, `availability`, `otp_codes`.
- RPCs `create_booking(...)` and `create_appointment_from_booking(...)` (see §3).

How a public booking becomes a master `appointment` (via `create_appointment_from_booking`,
producing `source = 'online_booking'`) vs. the intermediate `bookings` table is **not fully
pinned down** — both paths exist and `bookings` is empty. This is [open-questions.md](./open-questions.md) Q-DB-2.

### 2.3 `data-model.md`'s "at a glance" table is incomplete

It omits `payment_type`, `sale`, `sale_item` (documented elsewhere), and all three
public-booking tables. `payment-types.md` itself notes "*payment_type should be added there.*"

### 2.4 Minor field discrepancy

`appointments.duration` is **`NOT NULL`** in the live DB (and in `data-model.md`), but
`appointments.md` lists it as nullable. Treat it as **required** (the create form enforces
`duration ≥ 1`).

## 3. RPCs (11 in `public`)

All are `SECURITY DEFINER` except `update_updated_at`. These are the **only** non-CRUD server
operations; the mobile app calls a subset via `supabase.rpc(...)` inside the api layer.

| RPC | Used by mobile? | Purpose |
|---|---|---|
| `complete_appointment(p_appointment_id, p_amount, p_payment_type_id, p_items jsonb) → uuid` | ✅ | Atomic checkout: set status `completed`, insert `sale` + `sale_item[]`. Checks `auth.uid()` ownership; raises `already_completed` / `appointment_not_found`. |
| `get_analytics_v2(p_from, p_to, p_prev_from, p_prev_to, p_granularity, p_tz) → json` | ✅ | Period metrics + revenue series (current + previous). |
| `get_analytics_widgets_v2(p_top_from,…, p_tz) → json` | ✅ | Fixed-window widgets: top services (30d), client mix (90d), busiest days (56d). |
| `appointment_day_counts(p_from, p_to, p_tz) → table(day, cnt)` | ✅ | Per-day appointment counts for calendar dots. |
| `check_username_available(p_username) → boolean` | ✅ | Username uniqueness check in onboarding/profile. |
| `complete_onboarding(p_payload jsonb) → uuid` | ✅ | **SECURITY INVOKER** (caller's RLS). One transaction: `master_profile` + `master_settings` + `service[]` (+ `service_category` per distinct name). Raises `already_completed`, `invalid_payload` (22023); username clash = 23505. A service without a price is saved with `price 0, show_online false` (a draft, hidden from the public page). |
| `specialization_keys() → text[]` | ❌ (CHECKs) | Immutable list of the 14 profession keys shared by both CHECK constraints. |
| `analytics_period_metrics(p_uid, p_from, p_to) → json` | ❌ (internal) | Scalar-metrics helper; not granted to any role. |
| `create_booking(p_username, p_service_ids, p_starts_at, p_phone, p_note) → jsonb` | ❌ (public site) | Anon creates a public booking. |
| `create_appointment_from_booking(p_username, p_service_ids, p_starts_at, p_phone, p_first_name, p_last_name, p_note) → jsonb` | ❌ (public site) | Anon path that materialises an `appointment`. |
| `rls_auto_enable()` (event trigger fn) | — | Infra: auto-enables RLS on newly created tables. |

**Triggers:** `update_updated_at()` (BEFORE UPDATE) is attached to `appointments`, `client`,
`payment_type`, `service`, `service_category`, `time_block`. `master_profile`, `master_settings`,
`sale`, `sale_item` have **no** `updated_at` trigger — those are application-maintained (or have
no `updated_at`).

## 4. Security advisor findings (2026-08-19)

From `get_advisors(security)`:

| Level | Finding | Note for mobile |
|---|---|---|
| WARN | `complete_appointment` & `create_appointment_from_booking` are **executable by `anon`** | `complete_appointment` should have `anon` EXECUTE revoked (it's a master-only op; it already checks `auth.uid()`, so anon calls fail closed, but the grant is wrong). Q-DB-3. |
| WARN | Several `SECURITY DEFINER` fns executable by `authenticated` (`get_analytics_v2/widgets`, `appointment_day_counts`, `check_username_available`, `complete_appointment`) | Expected for the RPC pattern; each filters by `auth.uid()` internally. No action, but keep filtering. |
| WARN | **Leaked-password protection disabled** in Auth | Recommend enabling (HaveIBeenPwned). Q-DB-4. |
| INFO | `otp_codes` RLS enabled, no policies | Intentional (service-role only). No action for mobile. |

From `get_advisors(performance)`: only **unused-index** INFOs (`service_user_id_idx`,
`payment_type_user_id_idx`, `service_category_id_idx`, `sale_client_id_idx`,
`time_block_start_at_idx/end_at_idx`, plus public-booking indexes). These are low-traffic / new
tables — no action needed now; revisit at scale.

## 5. Auth

- **Provider:** Supabase Auth. Master sessions are `auth.users` rows.
- **Methods active:** email + password, Google OAuth. **Apple** is planned (native iOS Sign-in
  with Apple is required for App Store — a genuinely native flow, `signInWithIdToken` + nonce,
  not a web redirect). Phone OTP is **public-booking-only**; masters do **not** use it.
- **Email confirmation:** currently **disabled** in project settings (`signUp` returns a session
  immediately). If enabled later, the app needs a "check your email" state (web has a plan).
- The web client uses `createClient(url, publishableKey)` with **no options** and browser
  `localStorage`. The mobile app **must** configure a React Native storage adapter,
  `autoRefreshToken` tied to `AppState`, `persistSession: true`, and `detectSessionInUrl: false`
  — see [api-layer.md](./api-layer.md) §"Supabase in React Native".

## 6. Storage

One bucket: **`avatars`** (public). Path layout `<userId>/avatar-<timestamp>.webp`; write policies
are owner-scoped (first path segment = `auth.uid()`); **no upsert** (unique timestamped names,
avoids the RLS-on-upsert gotcha). The public URL is stored in `master_profile.avatar_url`. The
mobile app uploads a client-resized square WebP (≤512px) — it needs an image pipeline
(`expo-image-manipulator`) analogous to the web's `resizeImageToSquare`.

## 7. Migration workflow (shared DB — be careful)

- Migrations live in `master.seene/supabase/migrations/` (the web repo). There is **no local
  Supabase**; DDL is applied to production via the Supabase MCP `execute_sql` tool
  (**not** `apply_migration`).
- **Do not change the schema from the mobile repo without explicit approval** — it is a shared
  production database with live master data (150 appointments, 131 sales). Schema is treated as
  read-only from this app's perspective for now.

## 8. What the mobile app needs from the DB (summary)

Read/write CRUD (RLS-scoped) on the 10 master-app tables + 5 RPCs (`complete_appointment`,
`get_analytics_v2`, `get_analytics_widgets_v2`, `appointment_day_counts`,
`check_username_available`) + the `avatars` bucket + Supabase Auth. It does **not** touch
`bookings`, `availability`, `otp_codes`, or the two booking RPCs.
