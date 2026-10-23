-- Phase 1 of the master page plan: data for the new public master page.
--
-- Every new column has a default, so older versions of the master app keep
-- working; until the app can edit these fields, the web falls back to the
-- spec defaults. Tables for later phases (booking_link, slot_hold) come with
-- the code that uses them.

-- 1. master_profile: poster, experience, visits counter, map link, verified badge.
ALTER TABLE public.master_profile
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS experience_years smallint
    CHECK (experience_years BETWEEN 0 AND 80),
  ADD COLUMN IF NOT EXISTS show_visits_count boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS map_url text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.master_profile.cover_url IS
  'Public URL of the page poster in the `master-media` bucket. NULL = no poster.';
COMMENT ON COLUMN public.master_profile.is_verified IS
  '"Verified master" badge. Set by hand during the test; not editable by the master.';

ALTER TABLE public.master_profile
  DROP CONSTRAINT IF EXISTS master_profile_bio_length;
ALTER TABLE public.master_profile
  ADD CONSTRAINT master_profile_bio_length CHECK (char_length(bio) <= 600);

-- The page lives at /<username>: lowercase letters, digits, '_' and '-', 3-30
-- characters, starting with a letter or digit. No dots. Service paths of the
-- site are reserved.
ALTER TABLE public.master_profile
  DROP CONSTRAINT IF EXISTS master_profile_username_format;
ALTER TABLE public.master_profile
  ADD CONSTRAINT master_profile_username_format CHECK (
    username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'
    AND username NOT IN (
      'about', 'admin', 'api', 'app', 'assets', 'blog', 'book', 'booking', 'c',
      'calculator', 'compare', 'en', 'fr', 'help', 'login', 'master', 'masters',
      'pricing', 'privacy', 'ru', 'seene', 'signup', 'static', 'support', 'terms',
      'waitlist', 'www'
    )
  );

-- A master can no longer edit is_verified: the "update own profile" policy
-- covers whole rows, so pin the column with a trigger instead.
CREATE OR REPLACE FUNCTION public.master_profile_keep_verified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.is_verified := CASE WHEN TG_OP = 'INSERT' THEN false ELSE OLD.is_verified END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS master_profile_keep_verified ON public.master_profile;
CREATE TRIGGER master_profile_keep_verified
  BEFORE INSERT OR UPDATE ON public.master_profile
  FOR EACH ROW EXECUTE FUNCTION public.master_profile_keep_verified();

-- 2. master_settings: page theme and accent, booking horizon, cancel window,
--    vacation. Accent is a preset key or a '#RRGGBB' color.
ALTER TABLE public.master_settings
  ADD COLUMN IF NOT EXISTS page_theme text NOT NULL DEFAULT 'light'
    CHECK (page_theme IN ('light', 'dark')),
  ADD COLUMN IF NOT EXISTS page_accent text NOT NULL DEFAULT 'rose'
    CHECK (
      page_accent IN ('rose', 'powder', 'lavender', 'sage', 'terracotta', 'graphite', 'gold', 'black')
      OR page_accent ~ '^#[0-9A-Fa-f]{6}$'
    ),
  ADD COLUMN IF NOT EXISTS booking_horizon_days smallint NOT NULL DEFAULT 14
    CHECK (booking_horizon_days BETWEEN 1 AND 90),
  ADD COLUMN IF NOT EXISTS cancel_window_hours smallint NOT NULL DEFAULT 12
    CHECK (cancel_window_hours BETWEEN 0 AND 168),
  ADD COLUMN IF NOT EXISTS vacation_from date,
  ADD COLUMN IF NOT EXISTS vacation_until date;

ALTER TABLE public.master_settings
  DROP CONSTRAINT IF EXISTS master_settings_vacation_range;
ALTER TABLE public.master_settings
  ADD CONSTRAINT master_settings_vacation_range
    CHECK (vacation_from IS NULL OR vacation_until IS NULL OR vacation_until >= vacation_from);

COMMENT ON COLUMN public.master_settings.theme IS
  'Theme of the master app itself. The public page uses page_theme.';

-- 3. service: photo, "from" price, hide from online booking.
ALTER TABLE public.service
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS price_from boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_online boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.service.price_from IS 'Show the price as "from <price>".';

-- 4. client: blacklist and consents. Consents default to false: only an
--    explicit choice on the booking form turns them on.
ALTER TABLE public.client
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminders_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false;

-- 5. portfolio_item: the "Works" block. Public read, owner writes.
CREATE TABLE IF NOT EXISTS public.portfolio_item (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  photo_url  text NOT NULL,
  service_id uuid REFERENCES public.service (id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_item_user_sort_idx
  ON public.portfolio_item (user_id, sort_order);
CREATE INDEX IF NOT EXISTS portfolio_item_service_idx
  ON public.portfolio_item (service_id);

ALTER TABLE public.portfolio_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read portfolio items" ON public.portfolio_item
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own portfolio items" ON public.portfolio_item
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own portfolio items" ON public.portfolio_item
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own portfolio items" ON public.portfolio_item
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- 6. Public bucket for the poster, portfolio and service photos, laid out as
--    `<user_id>/<file>` like `avatars`. No broad SELECT policy: public files are
--    served by the public endpoint, and listing stays closed.
INSERT INTO storage.buckets (id, name, public)
VALUES ('master-media', 'master-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own master media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'master-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own master media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'master-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own master media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'master-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'master-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own master media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'master-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
