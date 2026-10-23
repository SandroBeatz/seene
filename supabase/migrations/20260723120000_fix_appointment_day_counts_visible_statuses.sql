-- supabase/migrations/20260723120000_fix_appointment_day_counts_visible_statuses.sql
-- The ScheduleCalendar day-strip dots must match the appointments the schedule
-- actually renders. The schedule shows only pending/confirmed/completed
-- (see src/widgets/home/model/schedule-appointments.ts), but the original RPC
-- counted every non-cancelled row — so no_show/expired inflated the dot count
-- (e.g. 5 dots for 4 visible appointments). Align the filter to the visible set.

CREATE OR REPLACE FUNCTION appointment_day_counts(
  p_from TIMESTAMPTZ,
  p_to   TIMESTAMPTZ,
  p_tz   TEXT
)
RETURNS TABLE(day DATE, cnt INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (start_at AT TIME ZONE p_tz)::date AS day,
         COUNT(*)::int                      AS cnt
    FROM appointments
   WHERE user_id = auth.uid()
     AND start_at >= p_from
     AND start_at <  p_to
     AND status IN ('pending', 'confirmed', 'completed')
   GROUP BY 1;
$$;

-- SECURITY DEFINER functions default to PUBLIC execute; lock down to authenticated.
REVOKE ALL ON FUNCTION appointment_day_counts(timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION appointment_day_counts(timestamptz, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION appointment_day_counts(timestamptz, timestamptz, text) TO authenticated;
