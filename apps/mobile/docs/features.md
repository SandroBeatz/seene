---
version: 1.0
date: 2026-08-19
category: features
status: draft
---

# Features & User Scenarios

> What the app does, screen by screen, in terms of user goals. Behaviour rules live in
> [business-logic.md](./business-logic.md); this doc is the functional map used to scope screens
> and navigation. "Mobile note" flags where the mobile UX should intentionally diverge from web.

## Feature inventory (ported from the web app)

The web app ships these slices: **entities** — analytics, appointment, client, master,
payment-type, sale, service, service-category, session, time-block. **features** —
account-settings, appointment-checkout, appointment-form, appointment-wizard, auth-login,
auth-register, booking-settings-form, client-delete, client-form, contacts-form,
notification-settings-form, onboarding, payment-type-form, profile-form, service-category-form,
service-form, system-region-form, time-block-form, time-off-wizard, working-hours-form.
**widgets** — action-appointments, analytics, app-shell, appointment-preview-panel,
authorization-layout, calendar, client-details-panel, dashboard-layout, home, mobile-shell,
onboarding-layout, quick-create-action.

The mobile app reproduces the **user-facing capabilities** of these, re-expressed as native
screens and flows below.

## 1. Authentication

- **Sign in / sign up (one flow)** — Welcome → "Войти по почте" → email → 6-digit code from the
  email (Supabase email OTP; the account is created on first use, no password). Also "Continue with
  Google"; Apple button present but "Coming soon". New master → onboarding, existing → app.
- Both: mutually-disabling loading states; OAuth separator.
- **Mobile note:** Google uses the native `expo-auth-session` / Supabase native OAuth, not a web
  redirect. Apple Sign In must be native (App Store requirement once any social login ships).

## 2. Onboarding (mandatory 5-step wizard)

Specializations → Personal info (+ username availability) → Address & location (+ Places
autocomplete, country→time-format) → Schedule & timezone → Review & create. Creates
`master_profile`, upserts `master_settings`. Cannot reach the dashboard until complete.
- **Mobile note:** full-screen stepper; native pickers for country, timezone, times; device
  timezone prefilled. **No Google Places for MVP** — address is manual (country select + free-text
  street/house/zip/city); `place_id` stays unused (Q-PROD-3, resolved).

## 3. Home / Dashboard

Landing after auth. Composes:
- **Greeting** (name + avatar from session profile).
- **Overview metrics** — earned / appointments / hours, with a Day/Week/Month switcher
  (`today`/`this_week`/`this_month`), from `get_analytics_v2`.
- **Schedule timeline** — today's appointments as a timeline.
- **Action appointments** — items needing attention (pending, or confirmed & past) with
  Confirm / Complete / etc. inline.
- **Quick create "+"** — opens the create menu.

## 4. Calendar

Week / Day / Month views of appointments + time blocks (web uses FullCalendar; **mobile must not**
— see mobile note). Slot tap → quick-create prefilled. Event tap → appointment preview panel.
Honours `master_settings`: `calendar_first_day`, `calendar_slot_step_minutes`,
`default_calendar_view`. Fetches a window (≈ −1 month … +1 month) of appointments + time blocks;
day counts via `appointment_day_counts` RPC.
- **Mobile note:** FullCalendar is a DOM library and does **not** belong in RN. **Decided:** use
  `react-native-calendars` (Wix) — `Timeline` (day/week time-grid), `Agenda`/`CalendarList`
  (month + list), `markedDates` for day dots. Map appointments/time-blocks → Timeline events with
  status colors. Spike Timeline slot-tap/drag early (Q-UX-1, resolved).

## 5. Quick create (appointment / time off wizard)

The fast daily loop. From home "+", calendar "+", or calendar slot tap. Two branches:
- **New appointment** — 4 steps: Client (search / add inline) → Services (multi-select) →
  Date & time (availability-aware; grouped free slots morning/day/evening; always-available manual
  time; past-day supported → writes `confirmed`) → Confirm (summary + comment). Writes a `manual`
  appointment via `createAppointment`.
- **Time off** — Date → available intervals / All day → Confirm. Writes a `time_block`.
- Availability comes from the pure scheduling core (see business-logic §9). Must ship with unit
  tests for the math and component tests for step gating.
- **Mobile note:** this flow is already designed "mobile-first" on web (full-screen on mobile) —
  it is the highest-value flow to get native and fast.

## 6. Appointment preview & lifecycle

A single status-aware detail panel (bottom sheet on mobile) driven by declarative config, not
per-status branches. Shows status pill, contextual tags (Online booking, New client,
Paid·amount), client avatar, date/time card + duration chip, notes (allergy warning treatment),
contact (Call / WhatsApp), service list + total, payment info (completed only). Actions by status:

| Status | Primary | Secondary | Menu |
|---|---|---|---|
| pending | Confirm | Decline | Edit, Delete |
| confirmed | Complete & checkout | Cancel | Edit, Mark no-show, Delete |
| completed | — | — | Edit, Delete |
| cancelled / expired | — | — | Delete |
| no_show | — | — | Delete |

- **Appointment form** (create/edit/delete): client req., ≥1 service, date+time, duration ≥1;
  auto totals from services (overridable); timezone-aware.
- **Mobile note:** preview = `@gorhom/bottom-sheet`; destructive actions confirmed natively.

## 7. Checkout

From a confirmed appointment's "Complete & checkout": review/edit per-service amounts, pick
payment method (default preselected), confirm → `complete_appointment` RPC. See business-logic §5.

## 8. Clients

- **List** — search; Favorites / Others sections; card shows avatar, name, phone, last visit,
  manual/online badge, edit + favourite star.
- **Preview** (bottom sheet) — contacts (Call / WhatsApp / email), notes, full appointment history
  (resolved service names), favourite toggle, edit, delete.
- **Form** — create/edit with emoji avatar picker; intl phone; duplicate-phone handling.
- **Delete** — confirm dialog; blocked if appointments exist.

## 9. Services & categories

- **Services list** — rows with colour accent, category, name, description, duration pill, price,
  inline `is_active` switch, edit/delete; category filter chips with counts.
- **Service form** — name, description, duration (fixed set), price (currency-aware input),
  colour (palette), category (select or create inline), active.
- **Categories** — managed in settings (create/rename/delete; delete unassigns services).

## 10. Settings (nine sections)

| Section | Edits | Save UX |
|---|---|---|
| Profile | name, username (live availability), specializations, bio, **avatar** (upload/crop/resize→WebP) | Save bar; avatar instant |
| Contacts & social | phone, whatsapp/telegram/instagram/tiktok, contact email, country, address, `works_at_place`, `can_travel` | Save bar |
| Working hours | weekly `schedule` (per-day enable/start/end/breaks, copy-to-all) | Save bar |
| Booking | `online_booking_enabled` (instant), default status, buffer, min notice | Toggle instant + Save bar |
| Payment methods | system toggle, custom CRUD, reorder | Instant |
| Service categories | create/rename/delete | Instant |
| Notifications | client reminders (WhatsApp + offsets), master alerts | Save bar |
| System & region | language (en/fr/ru), theme (auto/light/dark), currency, time format, date format, timezone, calendar first day, default view, slot step | Save bar; language/theme live |
| Account | change email/password, sign out, **delete (soft)** | Per-action modals |

- **Mobile note:** language & theme apply live; theme integrates with the design-system color
  scheme (see [design-system.md](./design-system.md)). Avatar crop/resize uses
  `expo-image-manipulator`.

## 11. Analytics

Full dashboard: period toolbar (kind + jump-to-current + ←/→ stepper + Compare), four stat cards,
revenue chart (line/bar), and three fixed-window widgets (top services, client mix, busiest days +
peak hour). Read-only; all from the two analytics RPCs. Period persisted locally.
- **Mobile note:** charts need an RN charting lib (not Chart.js) — e.g. `victory-native` /
  Skia-based. Q-UX-2.

## 12. Cross-cutting capabilities

- **i18n** — three locales: en, fr, ru. All visible text is translated (a hard rule on web).
- **Formatting** — central helpers for time (12/24), price (currency), date (format), duration.
- **Overlays** — bottom sheets & modals via a consistent programmatic-open pattern.
- **Empty / loading / error states** — every list distinguishes first-load skeleton
  (`isPending`) from background refetch; defined design-system states (see design-system §states).
- **Deep links** — `scheme: appmasterseene`; used for OAuth return and (future) push taps.

## Not in scope for the mobile app

Public client booking page, availability/`bookings`/`otp_codes` tables, phone-OTP flow (all live
in the `seene` Nuxt site). CSV/PDF analytics export (hidden on web too). Billing/plans (upgrade
banner is comparison-only).
