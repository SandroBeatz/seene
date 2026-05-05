---
version: 2.0
date: 2026-05-05
category: business
---

# Data Model

> Version 2.0 · 2026-05-05 · [Business](../)

## Overview

Seene's database lives in Supabase PostgreSQL (project `foxqkomqtpbxyeqqwzpm`, region: ap-southeast-1, Singapore). All tables are in the `public` schema with Row-Level Security enabled. Every table is user-scoped — all data belongs to an `auth.users` record and is accessible only to its owner.

**Tables at a glance:**

| Table | Rows | Purpose |
|---|---|---|
| `master_profile` | 1 per user | Identity, contact, location, weekly schedule |
| `master_settings` | 1 per user | Display preferences (time format, calendar behaviour) |
| `service_category` | N per user | Groups for organising services |
| `service` | N per user | Individual services offered, with pricing and duration |
| `client` | N per user | Client address book |
| `appointments` | N per user | Bookings linking a client to services at a time |
| `time_block` | N per user | Blocked-off periods on the calendar (unavailability) |

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

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | — | FK → `auth.users.id`; one profile per auth user |
| `first_name` | `text` | NO | — | From onboarding Step 2 |
| `last_name` | `text` | NO | — | From onboarding Step 2 |
| `phone` | `text` | NO | — | International format, from Step 2 |
| `username` | `text` | NO | — | Unique; forms public URL `seene.app/<username>` |
| `specializations` | `text[]` | NO | — | Array of category keys (see details below) |
| `country` | `text` | NO | `''` | ISO 3166-1 alpha-2 code or full country name |
| `address` | `text` | YES | `null` | Street address |
| `house_number` | `text` | YES | `null` | House/building number |
| `zip_code` | `text` | YES | `null` | Postal code |
| `city` | `text` | YES | `null` | City name |
| `place_id` | `text` | YES | `null` | Google Places ID; used for geocoding and map display |
| `works_at_place` | `boolean` | NO | `true` | Master accepts clients at their own address |
| `can_travel` | `boolean` | NO | `false` | Master can travel to client's location |
| `schedule` | `jsonb` | NO | — | Weekly schedule with timezone (see structure below) |
| `created_at` | `timestamptz` | NO | `now()` | Row creation timestamp |

### Constraints & indexes

| Name | Type | Columns | Notes |
|---|---|---|---|
| `master_profile_pkey` | PRIMARY KEY | `id` | — |
| `master_profile_username_key` | UNIQUE | `username` | Global uniqueness |
| `master_profile_user_id_unique` | UNIQUE | `user_id` | One profile per user |
| `master_profile_user_id_fkey` | FOREIGN KEY | `user_id → auth.users.id` | — |

### Row-Level Security

```sql
CREATE POLICY "Users can manage own profile"
  ON public.master_profile FOR ALL
  USING (auth.uid() = user_id);
```

### `specializations` — `text[]`

Array of service category keys. Order is not significant. At least one value is required (client-side validation).

| Key | English | Russian |
|---|---|---|
| `makeup` | Make-up | Макияж |
| `hair` | Hair | Волосы |
| `nails` | Nails | Ногти |
| `barber` | Barber | Барбер |
| `massage` | Massage | Массаж |
| `tattoo_piercing` | Tattoo and piercing | Тату и пирсинг |
| `depilation` | Depilation | Депиляция |
| `cosmetology` | Cosmetology | Косметология |
| `brows_lashes` | Brows and eyelashes | Брови и ресницы |

Display names are resolved at render time from i18n — only keys are stored.

### `schedule` — `jsonb`

```json
{
  "timezone": "Europe/Paris",
  "days": {
    "monday":    { "enabled": true,  "start": "09:00", "end": "18:00", "breaks": [{ "start": "13:00", "end": "14:00" }] },
    "tuesday":   { "enabled": true,  "start": "09:00", "end": "18:00", "breaks": [] },
    "wednesday": { "enabled": true,  "start": "09:00", "end": "18:00", "breaks": [] },
    "thursday":  { "enabled": true,  "start": "09:00", "end": "18:00", "breaks": [] },
    "friday":    { "enabled": true,  "start": "09:00", "end": "18:00", "breaks": [] },
    "saturday":  { "enabled": false, "start": null,    "end": null,    "breaks": [] },
    "sunday":    { "enabled": false, "start": null,    "end": null,    "breaks": [] }
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

| Column | Type | Nullable | Default | Constraint | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK | — |
| `user_id` | `uuid` | NO | — | UNIQUE, FK | FK → `auth.users.id` |
| `time_format` | `smallint` | NO | `24` | — | `12` (AM/PM) or `24` (HH:MM) |
| `calendar_first_day` | `smallint` | NO | `1` | `0–6` | Week start: 0=Sunday … 6=Saturday |
| `calendar_slot_step_minutes` | `smallint` | NO | `15` | `1–120` | Calendar time grid resolution in minutes |
| `default_calendar_view` | `text` | NO | `'timeGridWeek'` | enum check | One of: `dayGridMonth`, `timeGridWeek`, `timeGridDay` |
| `created_at` | `timestamptz` | NO | `now()` | — | — |
| `updated_at` | `timestamptz` | NO | `now()` | — | Application-maintained, not a trigger |

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

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | — | FK → `auth.users.id` |
| `name` | `text` | NO | — | Display name of the category |
| `sort_order` | `integer` | NO | `0` | Controls display ordering |
| `created_at` | `timestamptz` | NO | `now()` | — |

### Constraints & indexes

| Name | Type | Columns |
|---|---|---|
| `service_category_pkey` | PRIMARY KEY | `id` |
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

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | — | FK → `auth.users.id` |
| `category_id` | `uuid` | YES | `null` | FK → `service_category.id`; SET NULL on category delete |
| `name` | `text` | NO | — | Service display name |
| `description` | `text` | YES | `null` | Optional description |
| `duration` | `integer` | NO | — | Duration in minutes |
| `price` | `numeric` | NO | — | Price (currency determined by master's locale) |
| `color` | `text` | NO | `'#a78bfa'` | Hex color for calendar rendering |
| `is_active` | `boolean` | NO | `true` | Whether the service is available for booking |
| `sort_order` | `integer` | NO | `0` | Controls display ordering |
| `created_at` | `timestamptz` | NO | `now()` | — |
| `updated_at` | `timestamptz` | NO | `now()` | Application-maintained |

### Constraints & indexes

| Name | Type | Columns | Notes |
|---|---|---|---|
| `service_pkey` | PRIMARY KEY | `id` | — |
| `service_user_id_fkey` | FOREIGN KEY | `user_id → auth.users.id` | — |
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

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | — | FK → `auth.users.id` |
| `first_name` | `text` | NO | — | — |
| `last_name` | `text` | YES | `null` | Optional |
| `phone` | `text` | NO | — | Required; unique per master (see index below) |
| `email` | `text` | YES | `null` | Optional |
| `birthday` | `date` | YES | `null` | Optional |
| `notes` | `text` | YES | `null` | Free-text master notes |
| `source` | `text` | NO | `'manual'` | How this client was added (currently only `'manual'`) |
| `created_at` | `timestamptz` | NO | `now()` | — |
| `updated_at` | `timestamptz` | NO | `now()` | Application-maintained |

### Constraints & indexes

| Name | Type | Columns | Notes |
|---|---|---|---|
| `client_pkey` | PRIMARY KEY | `id` | — |
| `client_user_phone_unique` | UNIQUE | `(user_id, phone)` | Phone unique within a master's client book |
| `client_user_id_idx` | INDEX | `user_id` | Fast lookup by owner |
| `client_user_id_fkey` | FOREIGN KEY | `user_id → auth.users.id` | — |

### Row-Level Security

```sql
CREATE POLICY "Master manages own clients"
  ON public.client FOR ALL
  USING (auth.uid() = user_id);
```

### Deletion behaviour

A client **cannot be deleted** if they have existing appointments — the `appointments_client_id_fkey` uses `RESTRICT`. Appointments must be removed (or transferred) before deleting a client.

---

## `appointments`

A booking — one master, one client, one or more services, at a specific time.

### Schema

| Column | Type | Nullable | Default | Constraint | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK | — |
| `user_id` | `uuid` | NO | — | FK | FK → `auth.users.id` |
| `client_id` | `uuid` | NO | — | FK | FK → `client.id`; RESTRICT on client delete |
| `service_ids` | `uuid[]` | NO | `'{}'::uuid[]` | — | Denormalized array of `service.id` values |
| `start_at` | `timestamptz` | NO | — | — | Appointment start time (stored in UTC) |
| `duration` | `integer` | NO | — | — | Total duration in minutes |
| `price` | `numeric` | YES | `null` | — | Override price; `null` means use sum of services |
| `status` | `text` | NO | `'pending'` | enum check | See status values below |
| `notes` | `text` | YES | `null` | — | Master's notes for this appointment |
| `created_at` | `timestamptz` | NO | `now()` | — | — |
| `updated_at` | `timestamptz` | NO | `now()` | — | Application-maintained |

### `status` values

| Value | Meaning |
|---|---|
| `pending` | Created but not yet confirmed |
| `confirmed` | Master has confirmed the booking |
| `completed` | Appointment took place |
| `cancelled` | Cancelled by master or client |
| `no_show` | Client did not appear |

### `service_ids` — denormalized array

Services are stored as a `uuid[]` rather than a junction table. This means:
- No foreign key enforcement — a service can be deleted without blocking the appointment record.
- Application code must resolve service details at read time.
- The array can be empty `{}` (e.g. a manual block with no specific service).

### Constraints & indexes

| Name | Type | Columns | Notes |
|---|---|---|---|
| `appointments_pkey` | PRIMARY KEY | `id` | — |
| `appointments_user_id_idx` | INDEX | `user_id` | Filter by owner |
| `appointments_client_id_idx` | INDEX | `client_id` | Look up appointments by client |
| `appointments_start_at_idx` | INDEX | `start_at` | Calendar range queries |
| `appointments_status_idx` | INDEX | `status` | Filter by status |
| `appointments_user_id_fkey` | FOREIGN KEY | `user_id → auth.users.id` | — |
| `appointments_client_id_fkey` | FOREIGN KEY | `client_id → client.id` | DELETE: RESTRICT |

### Row-Level Security

```sql
CREATE POLICY "Master manages own appointments"
  ON public.appointments FOR ALL
  USING (auth.uid() = user_id);
```

---

## `time_block`

A period of unavailability on the master's calendar — not linked to a client or service. Used to block off personal time, holidays, or any other non-bookable window.

### Schema

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | — | FK → `auth.users.id` |
| `start_at` | `timestamptz` | NO | — | Block start (UTC) |
| `end_at` | `timestamptz` | NO | — | Block end (UTC) |
| `all_day` | `boolean` | NO | `false` | Whether the block spans the full day |
| `notes` | `text` | YES | `null` | Optional label/reason |
| `created_at` | `timestamptz` | NO | `now()` | — |
| `updated_at` | `timestamptz` | NO | `now()` | Application-maintained |

### Constraints & indexes

| Name | Type | Columns | Notes |
|---|---|---|---|
| `time_block_pkey` | PRIMARY KEY | `id` | — |
| `time_block_user_id_idx` | INDEX | `user_id` | — |
| `time_block_start_at_idx` | INDEX | `start_at` | Calendar range queries |
| `time_block_end_at_idx` | INDEX | `end_at` | Range end queries |
| `time_block_user_id_fkey` | FOREIGN KEY | `user_id → auth.users.id` | — |

### Row-Level Security

```sql
CREATE POLICY "Master manages own time blocks"
  ON public.time_block FOR ALL
  USING (auth.uid() = user_id);
```

---

## Security model summary

All seven tables follow the same pattern:

1. RLS is enabled on every table.
2. A single `PERMISSIVE` policy for `ALL` operations uses `auth.uid() = user_id` as the filter.
3. No cross-user reads are possible — not even for the booking flow.
4. There are no public (unauthenticated) read policies; all access requires a valid Supabase auth session.

---

## Migration History

| File | Date | Description |
|---|---|---|
| `20260425000000_initial_schema.sql` | 2026-04-25 | Create `master_profile` with identity, address, and schedule fields |
| `20260426000000_address_redesign.sql` | 2026-04-26 | Drop `floor/apartment/entrance_code`; add `country`; make address fields nullable |
| `20260426130000_add_place_id.sql` | 2026-04-26 | Add nullable `place_id` to `master_profile` |
| `20260426140000_master_settings.sql` | 2026-04-26 | Create `master_settings` with `time_format` |
| `20260426173941_add_check_username_available_rpc.sql` | 2026-04-26 | Add RPC for checking username availability |
| `20260427120000_create_service_tables.sql` | 2026-04-27 | Create `service_category` and `service` |
| `20260427200000_create_client_table.sql` | 2026-04-27 | Create `client` |
| `20260430000000_create_appointments.sql` | 2026-04-30 | Create `appointments` with status enum and indexes |
| `20260430100000_add_color_to_services.sql` | 2026-04-30 | Add `color` column to `service` |
| `20260502010000_create_time_blocks.sql` | 2026-05-02 | Create `time_block` |
| `20260503140000_calendar_behavior_settings.sql` | 2026-05-03 | Add `calendar_first_day`, `calendar_slot_step_minutes`, `default_calendar_view` to `master_settings` |

Full SQL is in `supabase/migrations/`.

---

## Cross-references

- [Supabase Integration](../integrations/supabase.md) — connection setup, migration workflow, and RLS guidance
- [Auth & Onboarding Flow](../business/auth-and-onboarding.md) — wizard that populates `master_profile` and `master_settings`
- [Services](../business/services.md) — service and category management business logic
- [Calendar Architecture](../architecture/calendar.md) — how `appointments`, `time_block`, and `master_settings` calendar fields are used in the calendar feature
