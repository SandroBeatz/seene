create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profile(id) on delete cascade,
  client_phone text not null,
  client_name text,
  service_ids uuid[] not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint bookings_client_phone_not_empty check (length(btrim(client_phone)) > 0),
  constraint bookings_service_ids_not_empty check (array_length(service_ids, 1) > 0),
  constraint bookings_time_range_valid check (ends_at > starts_at),
  constraint bookings_status_valid check (status in ('pending', 'confirmed', 'cancelled'))
);

create index bookings_master_id_idx on public.bookings (master_id);
create index bookings_starts_at_idx on public.bookings (starts_at);
create index bookings_status_idx on public.bookings (status);

alter table public.bookings enable row level security;

create policy "Anyone can create bookings"
  on public.bookings
  for insert
  with check (
    exists (
      select 1
      from public.master_profile
      where master_profile.id = bookings.master_id
    )
  );

create policy "Masters can view own bookings"
  on public.bookings
  for select
  using (
    exists (
      select 1
      from public.master_profile
      where master_profile.id = bookings.master_id
        and master_profile.user_id = (select auth.uid())
    )
  );

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profile(id) on delete cascade,
  day_of_week int,
  specific_date date,
  start_time time not null,
  end_time time not null,
  slot_duration int not null default 60,
  constraint availability_day_of_week_valid check (
    day_of_week is null or day_of_week between 0 and 6
  ),
  constraint availability_day_or_date_required check (
    (day_of_week is not null and specific_date is null)
    or (day_of_week is null and specific_date is not null)
  ),
  constraint availability_time_range_valid check (end_time > start_time),
  constraint availability_slot_duration_positive check (slot_duration > 0)
);

create index availability_master_id_idx on public.availability (master_id);
create index availability_master_day_of_week_idx
  on public.availability (master_id, day_of_week)
  where day_of_week is not null;
create index availability_master_specific_date_idx
  on public.availability (master_id, specific_date)
  where specific_date is not null;

alter table public.availability enable row level security;

create policy "Anyone can view availability"
  on public.availability
  for select
  using (true);

create policy "Masters can create own availability"
  on public.availability
  for insert
  with check (
    exists (
      select 1
      from public.master_profile
      where master_profile.id = availability.master_id
        and master_profile.user_id = (select auth.uid())
    )
  );

create policy "Masters can update own availability"
  on public.availability
  for update
  using (
    exists (
      select 1
      from public.master_profile
      where master_profile.id = availability.master_id
        and master_profile.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.master_profile
      where master_profile.id = availability.master_id
        and master_profile.user_id = (select auth.uid())
    )
  );

create table public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  constraint otp_codes_phone_not_empty check (length(btrim(phone)) > 0),
  constraint otp_codes_code_not_empty check (length(btrim(code)) > 0)
);

create index otp_codes_phone_idx on public.otp_codes (phone);
create index otp_codes_active_phone_expires_at_idx
  on public.otp_codes (phone, expires_at)
  where used = false;

alter table public.otp_codes enable row level security;
