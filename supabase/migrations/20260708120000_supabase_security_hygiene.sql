-- Supabase security hygiene: close advisor warnings (security + performance)
-- after booking-flow migrations. See ROADMAP_test_august.md Phase 0, item 4.

-- ============================================================
-- 1. SECURITY
-- ============================================================

-- 1a. function_search_path_mutable
alter function public.update_updated_at() set search_path = public;
alter function public.create_booking(text, uuid[], timestamptz, text, text) set search_path = public;

-- 1b. find_client_name_by_phone: unused (no callers in master.seene or seene,
-- confirmed across all branches), SECURITY DEFINER, anon-callable, no owner
-- check on master_user_id -> client-enumeration vector. Drop it.
drop function if exists public.find_client_name_by_phone(uuid, text);

-- 1c. complete_appointment already checks auth.uid() = user_id internally,
-- so anon calls always fail -- but there's no reason to expose the RPC to anon.
revoke execute on function public.complete_appointment(uuid, numeric, uuid, jsonb) from anon;

-- 1d. rls_auto_enable is an event-trigger handler, not meant to be called via RPC.
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

-- 1e. otp_codes: RLS enabled with no policies is intentional (service_role only,
-- via seene/server/api/auth/phone/{send,verify}.post.ts). Document it.
comment on table public.otp_codes is 'RLS enabled, intentionally no policies -- accessed only via service_role from seene server routes.';

-- ============================================================
-- 2. PERFORMANCE (auth_rls_initplan): wrap auth.uid() in (select auth.uid())
-- so it's evaluated once per statement instead of once per row.
-- Semantics unchanged.
-- ============================================================

alter policy "Users can manage own settings" on public.master_settings
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Master manages own clients" on public.client
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Master manages own appointments" on public.appointments
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Master manages own time blocks" on public.time_block
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users manage own payment types" on public.payment_type
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Master manages own sales" on public.sale
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Master manages own sale items" on public.sale_item
  using (exists (
    select 1 from sale
    where sale.id = sale_item.sale_id
      and sale.user_id = (select auth.uid())
  ));

-- ============================================================
-- 3. PERFORMANCE (multiple_permissive_policies): master_profile, service and
-- service_category each have a public "true" SELECT policy plus a "manage own"
-- FOR ALL policy, so PostgREST evaluates both permissive policies on every
-- SELECT. Split "manage own" into INSERT/UPDATE/DELETE (drop the SELECT arm)
-- so the public policy alone covers reads. Combined with the auth_rls_initplan
-- wrap from section 2.
-- ============================================================

drop policy "Users can manage own profile" on public.master_profile;

create policy "Users can insert own profile" on public.master_profile
  for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own profile" on public.master_profile
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own profile" on public.master_profile
  for delete
  using ((select auth.uid()) = user_id);

drop policy "Users manage own services" on public.service;

create policy "Users can insert own services" on public.service
  for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own services" on public.service
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete own services" on public.service
  for delete
  using (user_id = (select auth.uid()));

drop policy "Users manage own categories" on public.service_category;

create policy "Users can insert own categories" on public.service_category
  for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own categories" on public.service_category
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete own categories" on public.service_category
  for delete
  using (user_id = (select auth.uid()));
