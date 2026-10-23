-- Follow-up to Supabase hygiene: drop dead get_analytics v1 and add covering
-- indexes for user_id (RLS filter) and foreign keys flagged by the performance
-- advisor. See ROADMAP_test_august.md Phase 0, item 4.

-- get_analytics v1: replaced by get_analytics_v2 + get_analytics_widgets_v2,
-- no callers in master.seene or seene. Drop it (removes a SECURITY DEFINER
-- surface and an advisor line).
drop function if exists public.get_analytics(timestamptz, timestamptz);

-- user_id indexes: service/service_category/payment_type are filtered by
-- WHERE user_id = auth.uid() on every dashboard load (RLS + FK) but have no
-- index on user_id. These back both the RLS filter and the FK constraint.
create index if not exists service_user_id_idx on public.service (user_id);
create index if not exists service_category_user_id_idx on public.service_category (user_id);
create index if not exists payment_type_user_id_idx on public.payment_type (user_id);

-- Foreign-key covering indexes (joins in analytics, cascade lookups).
create index if not exists service_category_id_idx on public.service (category_id);
create index if not exists sale_client_id_idx on public.sale (client_id);
create index if not exists sale_payment_type_id_idx on public.sale (payment_type_id);
