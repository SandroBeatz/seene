-- Add System & region settings to the master's per-account config.
-- Surfaced in the System & region settings form (Settings → System & region).
--   currency     = ISO 4217 currency code used to format prices (app-level config,
--                  independent of UI locale; symbol/position come from the app config)
--   date_format  = preferred date display format (dayjs tokens)
--   language     = persisted interface language (cross-device); localStorage is the
--                  fast fallback until preferences load
--   theme        = persisted color scheme preference
-- Defaults keep existing behaviour: USD / DD.MM.YYYY / English / system theme.
-- Idempotent: safe to re-run.

ALTER TABLE public.master_settings
  ADD COLUMN IF NOT EXISTS currency    text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS date_format text NOT NULL DEFAULT 'DD.MM.YYYY',
  ADD COLUMN IF NOT EXISTS language    text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS theme       text NOT NULL DEFAULT 'auto';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_settings_language_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_language_check
      CHECK (language = ANY (ARRAY['en'::text, 'fr'::text, 'ru'::text]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_settings_theme_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_theme_check
      CHECK (theme = ANY (ARRAY['auto'::text, 'light'::text, 'dark'::text]));
  END IF;

  -- Keep this list in sync with shared/config/date-formats DATE_FORMATS values.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_settings_date_format_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_date_format_check
      CHECK (date_format = ANY (ARRAY[
        'DD.MM.YYYY'::text,
        'MM/DD/YYYY'::text,
        'YYYY-MM-DD'::text,
        'DD/MM/YYYY'::text
      ]));
  END IF;
  -- No CHECK on `currency`: the supported set is large and grows over time;
  -- it is validated at the application layer (normalizeCurrency).
END $$;
