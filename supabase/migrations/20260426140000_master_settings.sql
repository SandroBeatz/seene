-- Create master_settings table for per-master preferences (time_format, and more in future)
-- Applied: 2026-04-26

CREATE TABLE IF NOT EXISTS public.master_settings (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  time_format smallint    NOT NULL DEFAULT 24,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT master_settings_pkey PRIMARY KEY (id),
  CONSTRAINT master_settings_user_id_unique UNIQUE (user_id),
  CONSTRAINT master_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

ALTER TABLE public.master_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.master_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
