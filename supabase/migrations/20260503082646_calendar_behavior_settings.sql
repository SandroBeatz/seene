-- Add calendar behavior settings for master calendars.

ALTER TABLE public.master_settings
  ADD COLUMN IF NOT EXISTS calendar_first_day smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS calendar_slot_step_minutes smallint NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS default_calendar_view text NOT NULL DEFAULT 'timeGridWeek';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'master_settings_calendar_first_day_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_calendar_first_day_check
      CHECK (calendar_first_day BETWEEN 0 AND 6);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'master_settings_calendar_slot_step_minutes_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_calendar_slot_step_minutes_check
      CHECK (calendar_slot_step_minutes > 0 AND calendar_slot_step_minutes <= 120);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'master_settings_default_calendar_view_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_default_calendar_view_check
      CHECK (default_calendar_view IN ('dayGridMonth', 'timeGridWeek', 'timeGridDay'));
  END IF;
END $$;
