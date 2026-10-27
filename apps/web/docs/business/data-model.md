---
version: 2.6
date: 2026-10-27
category: business
---

# Data Model

> Version 2.5 · 2026-10-24 · [Business](../)

## Overview

Seene's database lives in Supabase PostgreSQL (project `foxqkomqtpbxyeqqwzpm`, region: ap-southeast-1, Singapore). All tables are in the `public` schema with Row-Level Security enabled. Every table is user-scoped — all data belongs to an `auth.users` record and is accessible only to its owner.

**Tables at a glance:**

| Table              | Rows       | Purpose                                                |
| ------------------ | ---------- | ------------------------------------------------------ |
| `master_profile`   | 1 per user | Identity, contact, location, weekly schedule           |
| `master_settings`  | 1 per user | Display preferences (time format, calendar behaviour)  |
| `service_category` | N per user | Groups for organising services                         |
| `service`          | N per user | Individual services offered, with pricing and duration |
| `client`           | N per user | Client address book                                    |
| `appointments`     | N per user | Bookings linking a client to services at a time        |
| `time_block`       | N per user | Blocked-off periods on the calendar (unavailability)   |

**Entity relationship overview:**

```
auth.users
├── master_profile (1:1)
├── master_settings (1:1)
├── service_category (1:N)
│   └── service (1:N, category_id nullable → SET NULL on delete)
├── service (1:N)
├── client (1:N)
│   └── appointments (1:N, client_id → RESTRICT on delete)
├── appointments (1:N)
│   └── service_ids uuid[] — denormalized array of service IDs
└── time_block (1:N)
```

---

## `master_profile`

Identity, location, and availability data for the master. Populated once at the end of the onboarding wizard (Step 5).

### Schema

| Column              | Type          | Nullable | Default             | Description                                                                                    |
| ------------------- | ------------- | -------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| `id`                | `uuid`        | NO       | `gen_random_uuid()` | Primary key                                                                                    |
| `user_id`           | `uuid`        | NO       | —                   | FK → `auth.users.id`; one profile per auth user                                                |
| `first_name`        | `text`        | NO       | —                   | From onboarding Step 2                                                                         |
| `last_name`         | `text`        | NO       | —                   | From onboarding Step 2                                                                         |
| `phone`             | `text`        | YES      | —                   | Optional since 2026-10-27 (not asked at onboarding; added in settings)                         |
| `username`          | `text`        | NO       | —                   | Unique; forms public URL `getseene.app/<username>` (format below)                              |
| `specializations`   | `text[]`      | NO       | —                   | Array of category keys (see details below)                                                     |
| `country`           | `text`        | NO       | `''`                | ISO 3166-1 alpha-2 code or full country name                                                   |
| `address`           | `text`        | YES      | `null`              | Street address                                                                                 |
| `house_number`      | `text`        | YES      | `null`              | House/building number                                                                          |
| `zip_code`          | `text`        | YES      | `null`              | Postal code                                                                                    |
| `city`              | `text`        | YES      | `null`              | City name                                                                                      |
| `place_id`          | `text`        | YES      | `null`              | Google Places ID; used for geocoding and map display                                           |
| `works_at_place`    | `boolean`     | NO       | `true`              | Master accepts clients at their own address                                                    |
| `can_travel`        | `boolean`     | NO       | `false`             | Master can travel to client's location                                                         |
| `schedule`          | `jsonb`       | NO       | —                   | Weekly schedule with timezone (see structure below)                                            |
| `created_at`        | `timestamptz` | NO       | `now()`             | Row creation timestamp                                                                         |
| `cover_url`         | `text`        | YES      | `null`              | Page poster, public URL in the `master-media` bucket                                           |
| `experience_years`  | `smallint`    | YES      | `null`              | Years of experience, 0–80                                                                      |
| `show_visits_count` | `boolean`     | NO       | `false`             | Show the number of visits on the public page                                                   |
| `map_url`           | `text`        | YES      | `null`              | Link for the "Map" button                                                                      |
| `is_verified`       | `boolean`     | NO       | `false`             | "Verified master" badge. Set by Seene; a trigger ignores changes from the master's own session |

`bio` is limited to 600 characters (`master_profile_bio_length`).

### `username` format

The page lives at `/<username>`, so the rule is strict and enforced in three places that must stay in
sync: the `master_profile_username_format` CHECK, `shared/utils/username.ts` (web) and
`isUsernameSyntaxValid` (master app).

- lowercase `a–z`, digits, `_` and `-`; 3–30 characters; starts with a letter or digit;
- **no dots** (they read as a file extension in a URL);
- site paths are reserved: `about`, `admin`, `api`, `app`, `assets`, `blog`, `book`, `booking`,
  `calculator`, `compare`, `help`, `login`, `master`, `masters`, `pricing`, `privacy`, `seene`,
  `signup`, `static`, `support`, `terms`, `waitlist`, `www` (plus locale prefixes).

### Constraints & indexes

| Name                            | Type        | Columns                   | Notes                |
| ------------------------------- | ----------- | ------------------------- | -------------------- |
| `master_profile_pkey`           | PRIMARY KEY | `id`                      | —                    |
| `master_profile_username_key`   | UNIQUE      | `username`                | Global uniqueness    |
| `master_profile_user_id_unique` | UNIQUE      | `user_id`                 | One profile per user |
| `master_profile_user_id_fkey`   | FOREIGN KEY | `user_id → auth.users.id` | —                    |

### Row-Level Security

```sql
CREATE POLICY "Users can manage own profile"
  ON public.master_profile FOR ALL
  USING (auth.uid() = user_id);
```

### `specializations` — `text[]`

Array of profession keys. Order is not significant. At least one value, all from `public.specialization_keys()` (CHECK `master_profile_specializations_valid`).

| Key                | English          | Russian              |
| ------------------ | ---------------- | -------------------- |
| `lashes`           | Lashes           | Ресницы              |
| `brows`            | Brows            | Брови                |
| `manicure`         | Manicure         | Маникюр              |
| `pedicure`         | Pedicure         | Педикюр              |
| `hair`             | Haircuts & hair  | Стрижка и волосы     |
| `barbers`          | Barbers          | Барберы              |
| `makeup`           | Makeup           | Макияж и визаж       |
| `skincare`         | Skincare         | Косметология         |
| `hair_removal`     | Hair removal     | Депиляция и эпиляция |
| `massage`          | Massage          | Массаж               |
| `permanent_makeup` | Permanent makeup | Перманентный макияж  |
| `tattoo`           | Tattoo           | Тату                 |
| `piercing`         | Piercing         | Пирсинг              |
| `pet_grooming`     | Pet grooming     | Груминг              |

Until 2026-10-27 there were 9 broad keys; `20261027200000_onboarding_redesign` mapped them (`nails` → `manicure`+`pedicure`, `tattoo_piercing` → `tattoo`+`piercing`, `brows_lashes` → `brows`+`lashes`, `depilation` → `hair_removal`, `cosmetology` → `skincare`, `barber` → `barbers`).

Display names are resolved at render time from i18n — only keys are stored.

### `schedule` — `jsonb`

```json
{
  "timezone": "Europe/Paris",
  "days": {
    "monday": {
      "enabled": true,
      "start": "09:00",
      "end": "18:00",
      "breaks": [{ "start": "13:00", "end": "14:00" }]
    },
    "tuesday": { "enabled": true, "start": "09:00", "end": "18:00", "breaks": [] },
    "wednesday": { "enabled": true, "start": "09:00", "end": "18:00", "breaks": [] },
    "thursday": { "enabled": true, "start": "09:00", "end": "18:00", "breaks": [] },
    "friday": { "enabled": true, "start": "09:00", "end": "18:00", "breaks": [] },
    "saturday": { "enabled": false, "start": null, "end": null, "breaks": [] },
    "sunday": { "enabled": false, "start": null, "end": null, "breaks": [] }
  }
}
```

- `timezone`: IANA timezone string (e.g. `"Europe/Moscow"`, `"America/New_York"`). Defaults to browser-detected timezone.
- All seven day keys are always present.
- When `enabled: false`, `start` and `end` are `null`; `breaks` is always `[]`.
- Times are `HH:MM` in 24-hour format, stored in the master's local timezone.
- Default: Monday–Friday 09:00–18:00 enabled; Saturday–Sunday disabled.

---

## `master_settings`

Per-master display and behaviour preferences. Created via upsert at the end of onboarding, after `master_profile`.

### Schema

| Column                       | Type          | Nullable | Default             | Constraint     | Description                                                                                                |
| ---------------------------- | ------------- | -------- | ------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `id`                         | `uuid`        | NO       | `gen_random_uuid()` | PK             | —                                                                                                          |
| `user_id`                    | `uuid`        | NO       | —                   | UNIQUE, FK     | FK → `auth.users.id`                                                                                       |
| `time_format`                | `smallint`    | NO       | `24`                | —              | `12` (AM/PM) or `24` (HH:MM)                                                                               |
| `calendar_first_day`         | `smallint`    | NO       | `1`                 | `0–6`          | Week start: 0=Sunday … 6=Saturday                                                                          |
| `calendar_slot_step_minutes` | `smallint`    | NO       | `15`                | `1–120`        | Calendar time grid resolution in minutes                                                                   |
| `default_calendar_view`      | `text`        | NO       | `'timeGridWeek'`    | enum check     | One of: `dayGridMonth`, `timeGridWeek`, `timeGridDay`                                                      |
| `created_at`                 | `timestamptz` | NO       | `now()`             | —              | —                                                                                                          |
| `updated_at`                 | `timestamptz` | NO       | `now()`             | —              | Application-maintained, not a trigger                                                                      |
| `page_theme`                 | `text`        | NO       | `'light'`           | `light`/`dark` | Theme of the public page (`theme` is the master app's own theme)                                           |
| `page_accent`                | `text`        | NO       | `'rose'`            | preset or hex  | Accent color: `rose`, `powder`, `lavender`, `sage`, `terracotta`, `graphite`, `gold`, `black` or `#RRGGBB` |
| `booking_horizon_days`       | `smallint`    | NO       | `14`                | `1–90`         | How many days ahead clients can book                                                                       |
| `cancel_window_hours`        | `smallint`    | NO       | `12`                | `0–168`        | Cancel by link allowed up to N hours before the visit                                                      |
| `vacation_from`              | `date`        | YES      | `null`              | —              | Vacation start; online booking is paused                                                                   |
| `vacation_until`             | `date`        | YES      | `null`              | `>= from`      | Vacation end, inclusive                                                                                    |

### Row-Level Security

```sql
CREATE POLICY "Users can manage own settings"
  ON public.master_settings FOR ALL
  USING (auth.uid() = user_id);
```

### `time_format`

Auto-detected from country at onboarding (US, Canada, Australia, India → `12`; all others → `24`). User can override. All time display goes through `$f.time()` in `src/shared/lib/formats/index.ts`.

### Calendar settings

`calendar_first_day`, `calendar_slot_step_minutes`, and `default_calendar_view` are consumed by the calendar feature (`src/features/calendar/`) to initialize FullCalendar. They are configured separately from onboarding in the user's settings UI.

---

## `service_category`

Named groups used to organise services. A service can belong to at most one category.

### Schema

| Column       | Type          | Nullable | Default             | Description                  |
| ------------ | ------------- | -------- | ------------------- | ---------------------------- |
| `id`         | `uuid`        | NO       | `gen_random_uuid()` | Primary key                  |
| `user_id`    | `uuid`        | NO       | —                   | FK → `auth.users.id`         |
| `name`       | `text`        | NO       | —                   | Display name of the category |
| `sort_order` | `integer`     | NO       | `0`                 | Controls display ordering    |
| `created_at` | `timestamptz` | NO       | `now()`             | —                            |

### Constraints & indexes

| Name                            | Type        | Columns                   |
| ------------------------------- | ----------- | ------------------------- |
| `service_category_pkey`         | PRIMARY KEY | `id`                      |
| `service_category_user_id_fkey` | FOREIGN KEY | `user_id → auth.users.id` |

### Row-Level Security

```sql
CREATE POLICY "Users manage own categories"
  ON public.service_category FOR ALL
  USING (user_id = auth.uid());
```

### Deletion behaviour

When a `service_category` row is deleted, all `service` rows that reference it via `category_id` have their `category_id` set to `NULL` (SET NULL rule on `service_category_id_fkey`). Services are not deleted.

---

## `service`

Individual services that a master offers — e.g. "Manicure", "Haircut & Blowdry". Each service has a fixed duration, price, and display color. Services can optionally belong to a `service_category`.

### Schema

| Column           | Type          | Nullable | Default             | Description                                                                   |
| ---------------- | ------------- | -------- | ------------------- | ----------------------------------------------------------------------------- |
| `id`             | `uuid`        | NO       | `gen_random_uuid()` | Primary key                                                                   |
| `user_id`        | `uuid`        | NO       | —                   | FK → `auth.users.id`                                                          |
| `category_id`    | `uuid`        | YES      | `null`              | FK → `service_category.id`; SET NULL on category delete                       |
| `name`           | `text`        | NO       | —                   | Service display name                                                          |
| `description`    | `text`        | YES      | `null`              | Optional description                                                          |
| `duration`       | `integer`     | NO       | —                   | Duration in minutes                                                           |
| `price`          | `numeric`     | NO       | —                   | Price (currency determined by master's locale)                                |
| `color`          | `text`        | NO       | `'#a78bfa'`         | Hex color for calendar rendering                                              |
| `is_active`      | `boolean`     | NO       | `true`              | Whether the service is available for booking                                  |
| `sort_order`     | `integer`     | NO       | `0`                 | Controls display ordering                                                     |
| `created_at`     | `timestamptz` | NO       | `now()`             | —                                                                             |
| `updated_at`     | `timestamptz` | NO       | `now()`             | Application-maintained                                                        |
| `photo_url`      | `text`        | YES      | `null`              | Photo in the public service list (`master-media` bucket)                      |
| `price_from`     | `boolean`     | NO       | `false`             | Show the price as "from <price>"                                              |
| `show_online`    | `boolean`     | NO       | `true`              | `false`: listed on the page, not bookable online                              |
| `specialization` | `text`        | YES      | `null`              | Profession ("section") the service belongs to; one of `specialization_keys()` |

A service with `price = 0` **and** `show_online = false` is a draft (saved without a price at onboarding): the public page (`/api/master/[username]`) does not return it until the master sets a price.

### Constraints & indexes

| Name                       | Type        | Columns                             | Notes            |
| -------------------------- | ----------- | ----------------------------------- | ---------------- |
| `service_pkey`             | PRIMARY KEY | `id`                                | —                |
| `service_user_id_fkey`     | FOREIGN KEY | `user_id → auth.users.id`           | —                |
| `service_category_id_fkey` | FOREIGN KEY | `category_id → service_category.id` | DELETE: SET NULL |

### Row-Level Security

```sql
CREATE POLICY "Users manage own services"
  ON public.service FOR ALL
  USING (user_id = auth.uid());
```

---

## `client`

The master's address book. Each entry represents a person who has had or may have an appointment.

### Schema

| Column              | Type          | Nullable | Default             | Description                                                     |
| ------------------- | ------------- | -------- | ------------------- | --------------------------------------------------------------- |
| `id`                | `uuid`        | NO       | `gen_random_uuid()` | Primary key                                                     |
| `user_id`           | `uuid`        | NO       | —                   | FK → `auth.users.id`                                            |
| `first_name`        | `text`        | NO       | —                   | —                                                               |
| `last_name`         | `text`        | YES      | `null`              | Optional                                                        |
| `phone`             | `text`        | NO       | —                   | Required; unique per master (see index below)                   |
| `email`             | `text`        | YES      | `null`              | Optional                                                        |
| `birthday`          | `date`        | YES      | `null`              | Optional                                                        |
| `notes`             | `text`        | YES      | `null`              | Free-text master notes                                          |
| `source`            | `text`        | NO       | `'manual'`          | How this client was added: `'manual'` or `'online_booking'`     |
| `blocked`           | `boolean`     | NO       | `false`             | Blacklist: online booking is refused without a reason           |
| `reminders_consent` | `boolean`     | NO       | `false`             | Agreed to service messages (reminders) on the booking form      |
| `marketing_consent` | `boolean`     | NO       | `false`             | Agreed to messages about next visits and offers; off by default |
| `created_at`        | `timestamptz` | NO       | `now()`             | —                                                               |
| `updated_at`        | `timestamptz` | NO       | `now()`             | Application-maintained                                          |

### Constraints & indexes

| Name                       | Type        | Columns                   | Notes                                      |
| -------------------------- | ----------- | ------------------------- | ------------------------------------------ |
| `client_pkey`              | PRIMARY KEY | `id`                      | —                                          |
| `client_user_phone_unique` | UNIQUE      | `(user_id, phone)`        | Phone unique within a master's client book |
| `client_user_id_idx`       | INDEX       | `user_id`                 | Fast lookup by owner                       |
| `client_user_id_fkey`      | FOREIGN KEY | `user_id → auth.users.id` | —                                          |

### Row-Level Security

```sql
CREATE POLICY "Master manages own clients"
  ON public.client FOR ALL
  USING (auth.uid() = user_id);
```

### Deletion behaviour

A client **cannot be deleted** if they have existing appointments — the `appointments_client_id_fkey` uses `RESTRICT`. Appointments must be removed (or transferred) before deleting a client.

---

## `portfolio_item`

Photos in the "Works" block of the public page. Public read, owner writes (same policies as `service`).

| Column       | Type          | Nullable | Default             | Description                                       |
| ------------ | ------------- | -------- | ------------------- | ------------------------------------------------- |
| `id`         | `uuid`        | NO       | `gen_random_uuid()` | Primary key                                       |
| `user_id`    | `uuid`        | NO       | —                   | FK → `auth.users.id`, cascade                     |
| `photo_url`  | `text`        | NO       | —                   | Public URL in the `master-media` bucket           |
| `service_id` | `uuid`        | YES      | `null`              | FK → `service.id`, SET NULL; caption of the photo |
| `sort_order` | `integer`     | NO       | `0`                 | Display order                                     |
| `created_at` | `timestamptz` | NO       | `now()`             | —                                                 |

Files for the poster, portfolio and service photos live in the public `master-media` bucket as
`<user_id>/<file>`, with owner-only write policies like `avatars`.

---

## `appointments`

A booking — one master, one client, one or more services, at a specific time.

### Schema

| Column             | Type          | Nullable | Default             | Constraint | Description                                                           |
| ------------------ | ------------- | -------- | ------------------- | ---------- | --------------------------------------------------------------------- |
| `id`               | `uuid`        | NO       | `gen_random_uuid()` | PK         | —                                                                     |
| `user_id`          | `uuid`        | NO       | —                   | FK         | FK → `auth.users.id`                                                  |
| `client_id`        | `uuid`        | NO       | —                   | FK         | FK → `client.id`; RESTRICT on client delete                           |
| `service_ids`      | `uuid[]`      | NO       | `'{}'::uuid[]`      | —          | Denormalized array of `service.id` values                             |
| `start_at`         | `timestamptz` | NO       | —                   | —          | Appointment start time (stored in UTC)                                |
| `duration`         | `integer`     | NO       | —                   | —          | Total duration in minutes                                             |
| `price`            | `numeric`     | YES      | `null`              | —          | Override price; `null` means use sum of services                      |
| `status`           | `text`        | NO       | `'pending'`         | enum check | See status values below                                               |
| `notes`            | `text`        | YES      | `null`              | —          | Master's notes for this appointment                                   |
| `cancelled_at`     | `timestamptz` | YES      | `null`              | —          | When it was cancelled                                                 |
| `cancelled_by`     | `text`        | YES      | `null`              | check      | `client` (by link) or `master`; `null` on older rows                  |
| `cancel_reason`    | `text`        | YES      | `null`              | ≤ 200      | Optional reason the client typed                                      |
| `rescheduled_from` | `uuid`        | YES      | `null`              | FK         | The appointment this one replaced (client moved it by link); SET NULL |
| `created_at`       | `timestamptz` | NO       | `now()`             | —          | —                                                                     |
| `updated_at`       | `timestamptz` | NO       | `now()`             | —          | Application-maintained                                                |

### `status` values

| Value       | Meaning                          |
| ----------- | -------------------------------- |
| `pending`   | Created but not yet confirmed    |
| `confirmed` | Master has confirmed the booking |
| `completed` | Appointment took place           |
| `cancelled` | Cancelled by master or client    |
| `no_show`   | Client did not appear            |

### `service_ids` — denormalized array

Services are stored as a `uuid[]` rather than a junction table. This means:

- No foreign key enforcement — a service can be deleted without blocking the appointment record.
- Application code must resolve service details at read time.
- The array can be empty `{}` (e.g. a manual block with no specific service).

### Constraints & indexes

| Name                          | Type        | Columns                   | Notes                          |
| ----------------------------- | ----------- | ------------------------- | ------------------------------ |
| `appointments_pkey`           | PRIMARY KEY | `id`                      | —                              |
| `appointments_user_id_idx`    | INDEX       | `user_id`                 | Filter by owner                |
| `appointments_client_id_idx`  | INDEX       | `client_id`               | Look up appointments by client |
| `appointments_start_at_idx`   | INDEX       | `start_at`                | Calendar range queries         |
| `appointments_status_idx`     | INDEX       | `status`                  | Filter by status               |
| `appointments_user_id_fkey`   | FOREIGN KEY | `user_id → auth.users.id` | —                              |
| `appointments_client_id_fkey` | FOREIGN KEY | `client_id → client.id`   | DELETE: RESTRICT               |

### Row-Level Security

```sql
CREATE POLICY "Master manages own appointments"
  ON public.appointments FOR ALL
  USING (auth.uid() = user_id);
```

### Personal link: `booking_link`

The confirmation and the reminder carry a personal link `/c/<token>` that opens one appointment
without signing in, to cancel or move it. Server-only table (RLS on, no policies).

| Column           | Type          | Description                                                     |
| ---------------- | ------------- | --------------------------------------------------------------- |
| `appointment_id` | `uuid`        | FK → `appointments.id`, cascade                                 |
| `token_hash`     | `text`        | SHA-256 of the 256-bit random token (unique); never the token   |
| `expires_at`     | `timestamptz` | Visit start + 24 h; after that the page says "visit has passed" |

One appointment can have several links (confirmation, reminder, a repeated tap). Functions:

- `cancel_appointment_by_link(token_hash, reason)` cancels while `master_settings.cancel_window_hours`
  (12 by default) has not started; raises `link_not_found`, `cancel_window_closed`, `not_cancellable`.
- `create_appointment_from_booking(…, p_link_hash, p_replaces_hash)` saves the new link and, for a
  move, cancels the old appointment after creating the new one, in one transaction
  (`reschedule_unavailable` if the old one is not hers or can no longer be cancelled).

---

## `time_block`

A period of unavailability on the master's calendar — not linked to a client or service. Used to block off personal time, holidays, or any other non-bookable window.

### Schema

| Column       | Type          | Nullable | Default             | Description                          |
| ------------ | ------------- | -------- | ------------------- | ------------------------------------ |
| `id`         | `uuid`        | NO       | `gen_random_uuid()` | Primary key                          |
| `user_id`    | `uuid`        | NO       | —                   | FK → `auth.users.id`                 |
| `start_at`   | `timestamptz` | NO       | —                   | Block start (UTC)                    |
| `end_at`     | `timestamptz` | NO       | —                   | Block end (UTC)                      |
| `all_day`    | `boolean`     | NO       | `false`             | Whether the block spans the full day |
| `notes`      | `text`        | YES      | `null`              | Optional label/reason                |
| `created_at` | `timestamptz` | NO       | `now()`             | —                                    |
| `updated_at` | `timestamptz` | NO       | `now()`             | Application-maintained               |

### Constraints & indexes

| Name                      | Type        | Columns                   | Notes                  |
| ------------------------- | ----------- | ------------------------- | ---------------------- |
| `time_block_pkey`         | PRIMARY KEY | `id`                      | —                      |
| `time_block_user_id_idx`  | INDEX       | `user_id`                 | —                      |
| `time_block_start_at_idx` | INDEX       | `start_at`                | Calendar range queries |
| `time_block_end_at_idx`   | INDEX       | `end_at`                  | Range end queries      |
| `time_block_user_id_fkey` | FOREIGN KEY | `user_id → auth.users.id` | —                      |

### Row-Level Security

```sql
CREATE POLICY "Master manages own time blocks"
  ON public.time_block FOR ALL
  USING (auth.uid() = user_id);
```

---

## `waitlist`

Applications from the founding masters form on the homepage (`#join`). Not linked to a master account: these are people who do not use Seene yet. Written only by `POST /api/waitlist` with the service role.

### Schema

| Column       | Type          | Nullable | Default             | Description                                                    |
| ------------ | ------------- | -------- | ------------------- | -------------------------------------------------------------- |
| `id`         | `uuid`        | NO       | `gen_random_uuid()` | Primary key                                                    |
| `name`       | `text`        | NO       | —                   | Her name, 1–60 characters                                      |
| `contact`    | `text`        | NO       | —                   | Instagram handle or WhatsApp number as typed, 2–100 characters |
| `country`    | `text`        | NO       | —                   | `kg`, `ca` or `other`: the visitor's market (IP or her choice) |
| `city`       | `text`        | YES      | `null`              | The city as typed for `kg` / `ca`, 2–100 characters            |
| `place`      | `text`        | YES      | `null`              | "Country and city" as typed for `other`, 2–100 characters      |
| `specialty`  | `text`        | NO       | —                   | What she does, as typed ("nails, brows"), 2–100 characters     |
| `locale`     | `text`        | NO       | `'en'`              | Site language she applied in (`en`, `fr`, `ru`)                |
| `ip_hash`    | `text`        | YES      | `null`              | SHA-256 of the IP with the server secret, for the hourly limit |
| `ip_country` | `text`        | YES      | `null`              | Two-letter country from the CDN header, for statistics         |
| `created_at` | `timestamptz` | NO       | `now()`             | —                                                              |

### Constraints & indexes

| Name                       | Type         | Columns                 | Notes                                      |
| -------------------------- | ------------ | ----------------------- | ------------------------------------------ |
| `waitlist_pkey`            | PRIMARY KEY  | `id`                    | —                                          |
| `waitlist_contact_unique`  | UNIQUE INDEX | `lower(btrim(contact))` | A repeated application keeps the first row |
| `waitlist_ip_created_idx`  | INDEX        | `ip_hash, created_at`   | At most 5 applications per IP per hour     |
| `waitlist_country_check`   | CHECK        | `country`               | `kg`, `ca`, `other`                        |
| `waitlist_city_by_country` | CHECK        | `country, city, place`  | `city` for `kg`/`ca`, `place` for `other`  |

### Row-Level Security

RLS enabled, no policies, `anon` and `authenticated` revoked: only the server reads and writes it. Spam protection is in the route: a hidden field, a minimum fill time and the IP limit.

---

## Security model summary

All seven tables follow the same pattern:

1. RLS is enabled on every table.
2. A single `PERMISSIVE` policy for `ALL` operations uses `auth.uid() = user_id` as the filter.
3. No cross-user reads are possible — not even for the booking flow.
4. There are no public (unauthenticated) read policies; all access requires a valid Supabase auth session.

---

## Migration History

| File                                                  | Date       | Description                                                                                          |
| ----------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `20260425000000_initial_schema.sql`                   | 2026-04-25 | Create `master_profile` with identity, address, and schedule fields                                  |
| `20260426000000_address_redesign.sql`                 | 2026-04-26 | Drop `floor/apartment/entrance_code`; add `country`; make address fields nullable                    |
| `20260426130000_add_place_id.sql`                     | 2026-04-26 | Add nullable `place_id` to `master_profile`                                                          |
| `20260426140000_master_settings.sql`                  | 2026-04-26 | Create `master_settings` with `time_format`                                                          |
| `20260426173941_add_check_username_available_rpc.sql` | 2026-04-26 | Add RPC for checking username availability                                                           |
| `20260427120000_create_service_tables.sql`            | 2026-04-27 | Create `service_category` and `service`                                                              |
| `20260427200000_create_client_table.sql`              | 2026-04-27 | Create `client`                                                                                      |
| `20260430000000_create_appointments.sql`              | 2026-04-30 | Create `appointments` with status enum and indexes                                                   |
| `20260430100000_add_color_to_services.sql`            | 2026-04-30 | Add `color` column to `service`                                                                      |
| `20260502010000_create_time_blocks.sql`               | 2026-05-02 | Create `time_block`                                                                                  |
| `20260503140000_calendar_behavior_settings.sql`       | 2026-05-03 | Add `calendar_first_day`, `calendar_slot_step_minutes`, `default_calendar_view` to `master_settings` |

Full SQL is in `supabase/migrations/`.

---

## Cross-references

- [Supabase Integration](../integrations/supabase.md) — connection setup, migration workflow, and RLS guidance
- [Auth & Onboarding Flow](../business/auth-and-onboarding.md) — wizard that populates `master_profile` and `master_settings`
- [Services](../business/services.md) — service and category management business logic
- [Calendar Architecture](../architecture/calendar.md) — how `appointments`, `time_block`, and `master_settings` calendar fields are used in the calendar feature
