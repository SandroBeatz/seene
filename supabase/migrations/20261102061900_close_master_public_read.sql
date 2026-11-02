-- Master data is no longer readable with the public key.
--
-- These policies let anyone holding that key read every master's phone and
-- address, plus hidden services and drafts. The public master page now reads
-- through the web server, which returns only the columns the page shows.
-- Deploy that code before applying this: the old route reads with the public key.
--
-- Supersedes the 2026-08-19 decision to keep master_profile world-readable.
--
-- Three of the dropped policies were created on staging outside migrations, so a
-- database built from migrations does not have them, and had no SELECT policy at
-- all on these tables. IF EXISTS covers both cases.

CREATE POLICY "Users can read own profile" ON public.master_profile
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can read own services" ON public.service
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can read own categories" ON public.service_category
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can read own portfolio items" ON public.portfolio_item
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Public can read master profiles" ON public.master_profile;
DROP POLICY IF EXISTS "Public can read services" ON public.service;
DROP POLICY IF EXISTS "Public can read service categories" ON public.service_category;
DROP POLICY IF EXISTS "Public can read portfolio items" ON public.portfolio_item;
