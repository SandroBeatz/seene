-- Add online-booking settings to the master's operational config.
-- Surfaced in the Booking settings form (Settings → Booking).
--   online_booking_enabled      = master switch for accepting online bookings
--   booking_default_status      = status applied to new online bookings
--                                 'confirmed' = auto-confirmed, 'pending' = needs confirmation
--   booking_buffer_minutes      = free time added AFTER each booking (cleanup)
--   booking_min_notice_minutes  = how far ahead clients must book
-- Defaults keep online booking OFF so existing masters' behaviour is unchanged.
-- Idempotent: safe to re-run.

ALTER TABLE public.master_settings
  ADD COLUMN IF NOT EXISTS online_booking_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_default_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS booking_buffer_minutes smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_min_notice_minutes integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_settings_booking_default_status_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_booking_default_status_check
      CHECK (booking_default_status = ANY (ARRAY['pending'::text, 'confirmed'::text]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_settings_booking_buffer_minutes_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_booking_buffer_minutes_check
      CHECK (booking_buffer_minutes >= 0 AND booking_buffer_minutes <= 240);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_settings_booking_min_notice_minutes_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_booking_min_notice_minutes_check
      CHECK (booking_min_notice_minutes >= 0);
  END IF;
END $$;
