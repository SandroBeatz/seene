-- Soft auto-expire of stale booking requests.
-- A pending appointment whose slot has passed sits in the widget's "needs a
-- decision" section so the professional can still act on it. After a 2-day
-- grace period a background job moves it to 'expired' so it stops being
-- actionable and old requests don't pile up forever.

-- 1. Allow the new 'expired' status.
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (
    status = ANY (
      ARRAY['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'expired']::text[]
    )
  );

-- 2. Enable pg_cron (no-op if already enabled).
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Daily job: expire pending requests whose slot ended more than 2 days ago.
--    cron.schedule upserts by job name, so re-running is safe.
SELECT cron.schedule(
  'expire-stale-pending-appointments',
  '0 3 * * *',
  $job$
    UPDATE public.appointments
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending'
      AND start_at + make_interval(mins => duration) < now() - interval '2 days';
  $job$
);
