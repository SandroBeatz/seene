-- Track where an appointment originated.
--   'manual'         = created by the professional in the app
--   'online_booking' = self-booked by the client through online booking
-- Idempotent: the column already exists in production; this records it in
-- migration history and is safe to re-run.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_source_check'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_source_check
      CHECK (source = ANY (ARRAY['manual'::text, 'online_booking'::text]));
  END IF;
END $$;
