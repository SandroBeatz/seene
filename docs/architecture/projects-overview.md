---
version: 1.0
date: 2026-06-24
category: architecture
---

# Projects Overview — `seene` and `master.seene`

> Version 1.0 · 2026-06-24 · [Architecture](../architecture/)

## Overview

Seene is built as **two separate repositories that share a single Supabase
database**. They are two faces of the same product:

|              | **`master.seene`**                        | **`seene`** (this repo)                                         |
| ------------ | ----------------------------------------- | --------------------------------------------------------------- |
| Audience     | B2B — the beauty professional ("master")  | B2C — the master's clients + marketing                          |
| Role         | Private **dashboard** to run the business | Public **booking site** + marketing landing                     |
| Stack        | Vue 3 (Vapor) + Vite + Pinia, FSD layout  | Nuxt 4 (SSR + Nitro server API), `app/` layout                  |
| URL          | `master-seene.vercel.app` (the dashboard) | `seene.app` (landing) + `seene.app/<username>` (public profile) |
| Auth         | Supabase Auth session (master logs in)    | Mostly anonymous; clients verify via phone OTP                  |
| Writes to DB | All master-owned tables                   | Its own booking/OTP tables + creates `appointments` via RPC     |

The critical fact that ties them together: **both apps point at the same Supabase
project `foxqkomqtpbxyeqqwzpm`** (region ap-southeast-1, Singapore). The dashboard
is the _system of record_ — the master configures their identity, services,
schedule, and preferences there. The public site is a _read-mostly consumer_ of
that data: it renders the master's public storefront and lets clients self-book.

This document defines who owns what, how data flows between the two apps, and —
most importantly — the **integration surface**: the settings the dashboard already
lets a master configure that the public site does _not yet_ consume. That gap is
the actionable part of this doc and is tracked as a beads epic (see
[Integration backlog](#integration-backlog)).

## Architecture

### Responsibility split

```
                         Supabase  (project foxqkomqtpbxyeqqwzpm)
                ┌──────────────────────────────────────────────┐
                │  master_profile   master_settings   service   │
                │  service_category client  appointments        │
                │  time_block  payment_type   + sale/checkout    │
                │  + seene's booking/OTP tables + RPCs            │
                └──────────────────────────────────────────────┘
                      ▲  writes (owner)            ▲  reads + RPC writes
                      │                            │
        ┌─────────────┴──────────────┐   ┌─────────┴─────────────────────┐
        │        master.seene         │   │            seene              │
        │  (B2B dashboard, Vue 3)     │   │  (B2C public site, Nuxt 4)    │
        │                             │   │                               │
        │  • Onboarding wizard        │   │  • Marketing landing (/)      │
        │  • Calendar / appointments  │   │  • Public profile             │
        │  • Services & categories    │   │      /<username>              │
        │  • Clients address book     │   │  • Booking flow               │
        │  • Settings (8 sections)    │   │      /<username>/book         │
        │  • Analytics / checkout     │   │  • Phone-OTP verification     │
        └─────────────────────────────┘   └───────────────────────────────┘
```

**`master.seene` owns** (writes): `master_profile`, `master_settings`,
`service_category`, `service`, `client`, `appointments` (manual), `time_block`,
`payment_type`, and the sale/checkout tables. It is the only app where a master
authenticates and edits their own data. RLS on every table is `auth.uid() =
user_id`, so the dashboard can only ever touch the logged-in master's rows.

**`seene` owns** (writes): its own booking/OTP plumbing — the booking tables and
RPCs under `seene/supabase/migrations/` (`create_booking_rpc`,
`create_appointment_from_booking`, OTP attempt tracking). It reads master data
through a **service-role Nitro server** (it has no logged-in user, so it bypasses
RLS server-side via `NUXT_SUPABASE_SERVICE_ROLE_KEY`) and writes appointments
only through restricted RPCs, never directly.

> **Why two apps and not one Nuxt app?** The dashboard is a heavy authenticated
> SPA (FullCalendar, drag-and-drop, large forms); the public site is a fast,
> SSR-rendered, mostly-anonymous storefront that must be SEO-friendly and load
> instantly for clients. Different runtime shapes, different deploy targets, one
> database.

### Data flow: how the public site reads master data

The public site never talks to Supabase from the browser. Every read goes through
a Nitro server route that uses the service-role client (`server/utils/supabase.ts`):

```
Client browser → GET /api/master/:username        (server/api/master/[username].get.ts)
                   → service-role Supabase read of master_profile + service_category + service
                 → GET /api/master/:username/slots (server/api/master/[username]/slots.get.ts)
                   → reads master_profile.schedule + appointments + time_block, computes free slots
                 → POST /api/master/:username/appointments
                   → phone-OTP verify, then RPC create_appointment_from_booking
```

The slot engine lives in `server/utils/slots.ts` — a pure function
(`buildFreeSlots` / `hasAnyFreeSlot`) that subtracts breaks, existing
appointments, and time blocks from the master's working hours.

### Data flow: how a booking is written back

A client booking becomes a row in the shared `appointments` table, written by
`seene` through the `create_appointment_from_booking` RPC (not a direct insert).
This is the one place the public site writes into dashboard-owned data, and it is
the seam where the dashboard's **booking settings** must be honoured (status,
buffer, minimum notice — see below). From the dashboard's side, these appointments
arrive with `source = 'online_booking'` (vs `'manual'` for ones the master creates
in the calendar).

### Schema ownership map

| Table              | Written by                  | Read by `seene`         | Notes                                                            |
| ------------------ | --------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `master_profile`   | dashboard                   | ✅ (public profile)     | Identity, schedule, contacts, avatar, bio                        |
| `master_settings`  | dashboard                   | ❌ **not yet**          | Language, currency, formats, booking gates — the integration gap |
| `service_category` | dashboard                   | ✅                      | Grouping on the services tab                                     |
| `service`          | dashboard                   | ✅ (active only)        | Bookable services                                                |
| `client`           | dashboard + seene (via RPC) | indirect                | Online bookings upsert a client                                  |
| `appointments`     | dashboard + seene (via RPC) | ✅ (for slot busy-time) | `source` distinguishes origin                                    |
| `time_block`       | dashboard                   | ✅ (for slot busy-time) | Unavailability windows                                           |
| `payment_type`     | dashboard                   | ❌ **not yet**          | Accepted payment methods                                         |
| booking/OTP tables | seene                       | ✅                      | Owned entirely by seene                                          |

## Configuration

Each app is configured independently but **must agree on the Supabase project**.

**`seene`** (`.env`, surfaced via `nuxt.config.ts → runtimeConfig`):

| Var                                    | Purpose                                                        |
| -------------------------------------- | -------------------------------------------------------------- |
| `NUXT_SUPABASE_URL`                    | Shared Supabase project URL                                    |
| `NUXT_SUPABASE_PUBLISHABLE_KEY`        | Anon key (client-safe)                                         |
| `NUXT_SUPABASE_SERVICE_ROLE_KEY`       | Service role — server-only, bypasses RLS for public reads      |
| `NUXT_PHONE_VERIFICATION_TOKEN_SECRET` | HMAC secret for the phone-OTP token                            |
| `NUXT_PUBLIC_DASHBOARD_URL`            | Link back to `master.seene` (e.g. for "manage your page" CTAs) |

**`master.seene`** (`.env`, surfaced via `vite.config.ts`):

| Var                                                   | Purpose                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Same Supabase project                                                           |
| `VITE_GOOGLE_MAPS_API_KEY`                            | Address autocomplete in onboarding/contacts                                     |
| `VITE_PUBLIC_BOOKING_URL`                             | Base URL of `seene` — used to build `https://<host>/<username>` open/copy links |

> **Migration ownership.** Both repos have a `supabase/migrations/` folder against
> the _same_ database. To avoid collisions, treat **dashboard-owned tables as
> migrated from `master.seene` only**, and **seene's booking/OTP tables as migrated
> from `seene` only**. Never re-define a dashboard table from `seene`. When `seene`
> needs a new column on a dashboard table, the migration belongs in `master.seene`.

## Integration backlog

This is the heart of the document: the dashboard already lets a master configure a
large surface that the public site **silently ignores today**. `seene` currently
does _not_ read `master_settings` at all (the generated type exists in
`shared/types/supabase.ts` but is never queried). Closing these gaps is the
"use everything the dashboard knows" work.

### Gap table — dashboard writes → public site should consume

| Dashboard setting (source)                                         | Stored in         | Public-site behaviour today                                   | Target behaviour                                                                                                                          |
| ------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `language`                                                         | `master_settings` | Ignored — locale comes from URL/visitor                       | **Hard override**: the master's public pages always render in the master's language. See [Language override](#language-override-decided). |
| `currency`                                                         | `master_settings` | `Intl.NumberFormat(locale)` with no currency                  | Format prices in the master's currency                                                                                                    |
| `time_format` (12/24)                                              | `master_settings` | Slots rendered with default formatting                        | Render times per the master's preference                                                                                                  |
| `date_format`                                                      | `master_settings` | Default                                                       | Format dates per the master's preference                                                                                                  |
| `online_booking_enabled`                                           | `master_settings` | No gate — anyone can always book                              | Hide/disable booking when `false`; show an "online booking unavailable" state                                                             |
| `booking_min_notice_minutes`                                       | `master_settings` | Ignored — past-cutoff slots offered                           | Exclude slots starting before `now + min_notice`                                                                                          |
| `booking_buffer_minutes`                                           | `master_settings` | Ignored — bookings can butt up                                | Reserve buffer _after_ each booking in slot search                                                                                        |
| `booking_default_status`                                           | `master_settings` | RPC sets a fixed status                                       | New online bookings take the master's default (`pending`/`confirmed`)                                                                     |
| `calendar_slot_step_minutes`                                       | `master_settings` | Hardcoded `SLOT_STEP_MINUTES = 30` in `server/utils/slots.ts` | Use the master's configured step                                                                                                          |
| `avatar_url`                                                       | `master_profile`  | Not selected by `[username].get.ts`; header shows initials    | Show the master's avatar                                                                                                                  |
| `bio`                                                              | `master_profile`  | Not selected                                                  | Show in the About tab                                                                                                                     |
| `whatsapp` / `telegram` / `instagram` / `tiktok` / `contact_email` | `master_profile`  | Not selected                                                  | Show contact/social links on the public profile                                                                                           |
| `payment_type` (accepted methods)                                  | `payment_type`    | Not read                                                      | Show accepted payment methods at confirmation                                                                                             |
| notification settings (client reminders)                           | `master_settings` | Not wired                                                     | Out of scope for the public render; reminders are a server/job concern                                                                    |

The authoritative field-by-field reference for every one of these settings lives
in the dashboard repo at `master.seene/docs/business/settings.md`,
`master.seene/docs/business/online-booking.md`, and
`master.seene/docs/business/data-model.md`. The slot-search algorithm the public
site should mirror (buffer, min-notice, gate) is specified in
`master.seene/docs/business/online-booking.md` → _Slot search_.

### Language override (decided)

The master's dashboard `language` is a **hard override** for their public pages:
when a visitor lands on `seene.app/<username>`, the page renders in the master's
configured language regardless of the visitor's browser locale or URL prefix, and
the in-page locale switcher is hidden on master-owned routes. The marketing
landing (`/`, `/about`, `/terms`, `/privacy`) keeps its own visitor-driven locale.

This is intentionally backed by the **shared** `master_settings.language` field
for now. A dedicated B2C language field (separate from the dashboard interface
language) is planned for the future; when added, the public site should prefer it
and fall back to `master_settings.language`.

### Server-side trust boundary

Because the public actor is untrusted, every booking constraint the dashboard
expresses as a setting must be **re-validated server-side** in `seene` (the Nitro
route / RPC), not just reflected in the UI. The dashboard validates client-side
because its actor is the trusted master; the public site cannot make that
assumption. Concretely: re-read `master_settings` server-side and reject bookings
that violate `online_booking_enabled`, `booking_min_notice_minutes`, the
buffer/working-hours overlap check, and force `source = 'online_booking'` +
`status = booking_default_status` regardless of the client payload.

## Usage

### Working across both repos

- **Adding a column a dashboard table needs for the public site** → migrate it in
  `master.seene`, regenerate types in both repos, then consume it in `seene`.
- **Reading a new master field on the public profile** → add it to the `select`
  in `server/api/master/[username].get.ts` and to the `MasterProfile` type in
  `shared/types/master.ts`, then surface it in the relevant `Master/Tab*.vue`.
- **Honouring a booking setting** → read it server-side in the slots/appointments
  routes (`server/api/master/[username]/...`), and enforce it in
  `server/utils/slots.ts` and the create-booking RPC.

### Finding the source of truth

When a question is about _how a setting behaves_, the dashboard docs are
authoritative because the dashboard defines and writes the setting:

- What each setting means, its defaults and constraints →
  `master.seene/docs/business/settings.md`
- How booking settings should drive slot search and appointment creation →
  `master.seene/docs/business/online-booking.md`
- Raw schema, columns, RLS, migration history →
  `master.seene/docs/business/data-model.md`

## Cross-references

- [Data Model](../business/data-model.md) — this repo's view of the shared schema (note: `master.seene/docs/business/data-model.md` is the more current v2.3 with the new settings/profile columns)
- [Theme Variables](../theme-variables.md) — design tokens for the public site
- `master.seene/docs/business/settings.md` — authoritative reference for every dashboard setting the public site should consume
- `master.seene/docs/business/online-booking.md` — slot-search & appointment-creation spec the public booking flow must mirror
- `master.seene/docs/business/data-model.md` — current schema for the shared tables

## File Structure

| Path                                                | Description                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| `nuxt.config.ts`                                    | Nuxt config: i18n (en/fr/ru), Supabase runtime config, route rules          |
| `shared/types/master.ts`                            | Public-facing master/service types returned by the API                      |
| `shared/types/supabase.ts`                          | Generated Supabase types (includes unused `master_settings`)                |
| `server/utils/supabase.ts`                          | Service-role Supabase client for server reads                               |
| `server/utils/slots.ts`                             | Pure slot-computation engine (where buffer/min-notice belong)               |
| `server/api/master/[username].get.ts`               | Public profile read (where new profile fields belong)                       |
| `server/api/master/[username]/slots.get.ts`         | Free-slot endpoint                                                          |
| `server/api/master/[username]/appointments.post.ts` | Booking write (OTP + RPC)                                                   |
| `app/pages/[username]/index.vue`                    | Public profile page (tabs, theme)                                           |
| `app/pages/[username]/book.vue`                     | Booking flow page                                                           |
| `app/composables/useBookingState.ts`                | Cross-step booking state                                                    |
| `app/composables/useMasterTheme.ts`                 | Per-master public-page theming                                              |
| `app/components/LocaleSwitcher.vue`                 | Locale switcher (to be hidden on master routes under the language override) |

</content>
</invoke>
