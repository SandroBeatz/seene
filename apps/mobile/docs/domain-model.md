---
version: 1.0
date: 2026-08-19
category: domain
status: draft
---

# Domain Model

> The entities the mobile app works with, their relationships, and the TypeScript shapes used at
> each layer of the data pipeline (DTO ↔ domain ↔ DB row). Schemas are verified against the live
> DB (see [database.md](./database.md)); TS shapes are ported from the web entities.

## 1. Entity-relationship map (master-app scope)

```
auth.users (master)
├── master_profile        1:1   (identity, address, schedule jsonb, avatar, deactivated_at)
├── master_settings       1:1   (preferences; row is lazy/upserted)
├── service_category      1:N   ─┐
├── service               1:N   ─┘ service.category_id → service_category.id  (SET NULL)
├── client                1:N
│     └── appointments    1:N   appointments.client_id → client.id            (RESTRICT)
├── appointments          1:N
│     ├── service_ids uuid[]     denormalised → service.id  (NO FK)
│     └── sale            1:1   sale.appointment_id UNIQUE → appointments.id   (CASCADE)
│                               └── sale_item  1:N  (CASCADE from sale)
├── time_block            1:N
└── payment_type          1:N   sale.payment_type_id → payment_type.id         (SET NULL)
```

Delete-rule cheat-sheet (behavioural consequences in [business-logic.md](./business-logic.md) §2):

| Edge | On delete | Consequence |
|---|---|---|
| `service.category_id → service_category` | SET NULL | Services survive, become uncategorised |
| `appointments.client_id → client` | RESTRICT | Can't delete a client with appointments |
| `sale.appointment_id → appointments` | CASCADE | Deleting an appointment erases its sale (revenue!) |
| `sale_item.sale_id → sale` | CASCADE | Sale delete removes its items |
| `sale.payment_type_id → payment_type` | SET NULL | Deleting a method keeps historical sales |
| `service_ids[] → service` | none (no FK) | Deleted service leaves stale ids; resolve at read |

## 2. Layered types

The mobile app keeps **three type roles per entity** (as the web does):

- **Row** — the DB row shape (snake_case). What Supabase returns.
- **Domain model** — what the app uses. Often identical to Row; joins add optional fields
  (e.g. `service.category`). We keep snake_case to match the web and avoid a mapping tax **for now**
  (see the DTO note below).
- **DTO** — inputs for create/update (subset, camelCase-free), keeping `user_id` server-derived.

Below are the canonical shapes to port (verbatim from the web entities; keep field names).

### Master

```ts
interface MasterProfile {
  id: string; user_id: string
  first_name: string; last_name: string; phone: string; username: string
  specializations: string[]                 // category keys
  bio: string | null; avatar_url: string | null
  whatsapp: string | null; telegram: string | null; instagram: string | null
  tiktok: string | null; contact_email: string | null
  country: string; address: string | null; house_number: string | null
  zip_code: string | null; city: string | null; place_id: string | null
  works_at_place: boolean; can_travel: boolean
  schedule: Schedule                        // jsonb, see below
  deactivated_at: string | null; created_at: string
}

interface Schedule {
  timezone: string                          // IANA, e.g. "Europe/Paris"
  days: Record<DayKey, ScheduleDay>         // all 7 keys always present
}
interface ScheduleDay { enabled: boolean; start: string | null; end: string | null; breaks: Break[] }
interface Break { start: string; end: string }   // "HH:MM" 24h, master tz

interface MasterSettings {
  time_format: 12 | 24
  calendar_first_day: number                // 0..6 (0=Sun)
  calendar_slot_step_minutes: number        // 1..120, default 15
  default_calendar_view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  language: 'en' | 'fr' | 'ru'; theme: 'auto' | 'light' | 'dark'
  currency: string; date_format: string
  online_booking_enabled: boolean
  booking_default_status: 'pending' | 'confirmed'
  booking_buffer_minutes: number            // 0..240
  booking_min_notice_minutes: number        // ≥0
  client_reminder_whatsapp_enabled: boolean
  client_reminder_offsets_minutes: number[] // subset of {1440,120,60}
  alert_new_booking_enabled: boolean
  alert_awaiting_confirmation_enabled: boolean
  alert_cancellation_enabled: boolean
  alert_upcoming_appointment_enabled: boolean
  alert_upcoming_offset_minutes: number
}

// The app also uses a normalized `MasterPreferences` view that merges profile+settings and
// fills DEFAULT_* for any missing value (rows are lazy). Port master-preferences.ts normalizers.
```

### Service & category

```ts
interface ServiceCategory { id: string; name: string }     // client reads only id,name
interface Service {
  id: string; user_id: string; category_id: string | null
  name: string; description: string | null
  duration: number                          // 15|30|45|60|90|120
  price: number; color: string; is_active: boolean; sort_order: number
  created_at: string; updated_at: string
  category?: ServiceCategory | null          // joined on read only
}
type CreateServiceDto = Omit<Service,'id'|'user_id'|'created_at'|'updated_at'|'category'>
type UpdateServiceDto = Partial<CreateServiceDto> & { id: string }
```

### Client

```ts
interface Client {
  id: string; user_id: string; phone: string
  first_name: string; last_name: string | null
  email: string | null; birthday: string | null   // YYYY-MM-DD
  notes: string | null; emoji: string | null
  is_favorite: boolean; source: string             // 'manual' | online
  created_at: string; updated_at: string
}
type CreateClientDto = Omit<Client,'id'|'user_id'|'created_at'|'updated_at'|'emoji'|'is_favorite'>
  & { emoji?: string | null; is_favorite?: boolean }
type UpdateClientDto = Partial<CreateClientDto> & { id: string }
```

### Appointment & time block

```ts
type AppointmentStatus = 'pending'|'confirmed'|'completed'|'cancelled'|'no_show'|'expired'
type EffectiveAppointmentStatus = AppointmentStatus | 'ongoing' | 'past'   // UI-derived, not stored
type AppointmentSource = 'manual' | 'online_booking'

interface Appointment {
  id: string; user_id: string; client_id: string
  service_ids: string[]                     // denormalised
  start_at: string                          // UTC ISO
  duration: number                          // minutes (NOT NULL)
  price: number | null                      // null = use sum of services
  status: AppointmentStatus; source: AppointmentSource
  notes: string | null; created_at: string; updated_at: string
}
interface CreateAppointmentDto {
  client_id: string; service_ids: string[]; start_at: string; duration: number
  price?: number | null; notes?: string | null
  status?: AppointmentStatus; source?: AppointmentSource
}
type UpdateAppointmentDto = { id: string } & Partial<Omit<CreateAppointmentDto,'source'>>

interface TimeBlock {
  id: string; user_id: string; start_at: string; end_at: string  // UTC
  all_day: boolean; notes: string | null; created_at: string; updated_at: string
}
```

### Payment type, sale, sale item

```ts
type PaymentTypeKind = 'cash' | 'card' | 'custom'
interface PaymentType {
  id: string; user_id: string; name: string; color: string
  kind: PaymentTypeKind; is_default: boolean; is_active: boolean; sort_order: number
  created_at: string; updated_at: string
}
const isSystemPaymentType = (pt: Pick<PaymentType,'kind'>) => pt.kind !== 'custom'

interface CompleteSaleDto {                 // input to complete_appointment RPC
  appointment_id: string; amount: number; payment_type_id: string
  items: { service_id: string | null; name: string; price: number }[]
}
interface Sale {
  id: string; user_id: string; appointment_id: string; client_id: string
  payment_type_id: string | null; amount: number; paid_at: string; created_at: string
  payment_type?: { name: string; color: string } | null
  items?: SaleItem[]
}
interface SaleItem { id: string; sale_id: string; service_id: string | null; name_snapshot: string; price_snapshot: number }
```

### Session

```ts
interface SessionProfile {                  // the lightweight profile the guard/store holds
  id: string; first_name: string; last_name: string; username: string
  avatar_url: string | null; deactivated_at: string | null
}
```

## 3. Derived (never-stored) values — must be recomputed identically

| Value | Rule | Source helper (port) |
|---|---|---|
| New client | `countClientAppointments(id) <= 1` | appointment api |
| Last visit | latest completed/confirmed appt whose end passed, else null | `lastVisitDate` |
| Effective status | `ongoing` if now in window; `past` if confirmed & ended & not completed | `getEffectiveAppointmentStatus` |
| Actionable | pending OR (confirmed AND start < now) | appointment api / query |
| Total duration/price | Σ of selected services (overridable) | appointment form |
| Availability slots | pure scheduling core | `shared/lib/scheduling` |

## 4. Enums & fixed sets (single source of truth)

- **Specialization keys (9):** makeup, hair, nails, barber, massage, tattoo_piercing, depilation,
  cosmetology, brows_lashes.
- **Appointment status (6):** pending, confirmed, completed, cancelled, no_show, expired.
- **Appointment source (2):** manual, online_booking.
- **Payment kind (3):** cash, card, custom.
- **Service duration (6):** 15, 30, 45, 60, 90, 120.
- **default_calendar_view (3):** dayGridMonth, timeGridWeek, timeGridDay (mobile maps these to
  native month/week/day views).
- **language (3):** en, fr, ru · **theme (3):** auto, light, dark.
- **Colour palettes:** services 10-colour set (default `#a78bfa`); payment custom 10-colour set;
  client initials 8-hue deterministic set.

These belong in `shared/config` / entity `config` as typed constants — never inline literals.

## 5. Naming & mapping decision (open)

The web app keeps **snake_case domain types** matching DB rows and casts `data as Type` (there is
**no generated Supabase type file** — a known weakness). For the mobile app we recommend either:
1. **Generate types** from Supabase (`supabase gen types typescript`) as `shared/api/database.types.ts`
   and derive Row types from them (safer, catches drift), keeping snake_case domain types; **or**
2. Introduce **camelCase domain models + mappers** in the api layer (cleaner app code, small tax).

This is [open-questions.md](./open-questions.md) Q-ARCH-1. Default recommendation: **(1) now**
(low effort, high safety), consider (2) later if the domain diverges from the DB.
