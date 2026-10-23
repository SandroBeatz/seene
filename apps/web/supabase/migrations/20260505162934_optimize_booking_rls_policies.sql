drop policy "Anyone can create bookings" on public.bookings;
drop policy "Masters can view own bookings" on public.bookings;
drop policy "Masters can create own availability" on public.availability;
drop policy "Masters can update own availability" on public.availability;

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
