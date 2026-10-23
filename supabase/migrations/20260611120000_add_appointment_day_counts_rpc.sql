-- supabase/migrations/20260611120000_add_appointment_day_counts_rpc.sql
-- Per-day appointment counts for the current user, grouped by calendar day in a
-- given timezone. Used by the ScheduleCalendar day strip to render busy-dots
-- under each day. Cancelled appointments are excluded.

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
     AND status <> 'cancelled'
   GROUP BY 1;
$$;

-- SECURITY DEFINER functions default to PUBLIC execute; lock down to authenticated.
REVOKE ALL ON FUNCTION appointment_day_counts(timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION appointment_day_counts(timestamptz, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION appointment_day_counts(timestamptz, timestamptz, text) TO authenticated;
