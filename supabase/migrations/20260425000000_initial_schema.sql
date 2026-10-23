-- Initial schema: master_profile table
-- Applied: 2026-04-25
-- Note: city, address, zip_code were NOT NULL at this point.
--       floor, apartment, entrance_code existed as nullable columns.
--       country and house_number did not yet exist (added in 20260426000000).

CREATE TABLE IF NOT EXISTS public.master_profile (
  id            uuid          NOT NULL DEFAULT gen_random_uuid(),
  user_id       uuid          NOT NULL,
  first_name    text          NOT NULL,
  last_name     text          NOT NULL,
  phone         text          NOT NULL,
  username      text          NOT NULL,
  specializations text[]      NOT NULL,
  city          text          NOT NULL,
  address       text          NOT NULL,
  zip_code      text          NOT NULL,
  floor         text,
  apartment     text,
  entrance_code text,
  works_at_place boolean      NOT NULL DEFAULT true,
  can_travel    boolean       NOT NULL DEFAULT false,
  schedule      jsonb         NOT NULL,
  created_at    timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT master_profile_pkey PRIMARY KEY (id),
  CONSTRAINT master_profile_username_key UNIQUE (username),
  CONSTRAINT master_profile_user_id_unique UNIQUE (user_id),
  CONSTRAINT master_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

-- RLS
ALTER TABLE public.master_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile"
  ON public.master_profile
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
