-- Cap the revenue time-series at "now" so the current, still-unfinished period
-- doesn't render future buckets as zeros.
--
-- The period range for an anchored unit is the FULL calendar unit (e.g. a week is
-- Mon..Sun, a month is the 1st..last day). For the current week/month that means
-- generate_series produced buckets for days that haven't happened yet, drawn as 0.
-- Bounding the series at LEAST(p_to, now()) stops the series at today while leaving
-- past periods (where p_to < now) untouched.
--
-- Only the revenue-series bucket generation changes; scalar metrics are unaffected.
-- Security model unchanged: SECURITY DEFINER, search_path = public, auth.uid()
-- filtering, EXECUTE for authenticated only.

CREATE OR REPLACE FUNCTION public.get_analytics_v2(
  p_from        TIMESTAMPTZ,
  p_to          TIMESTAMPTZ,
  p_prev_from   TIMESTAMPTZ,
  p_prev_to     TIMESTAMPTZ,
  p_granularity TEXT DEFAULT 'day',
  p_tz          TEXT DEFAULT 'UTC'
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid            UUID := auth.uid();
  v_trunc          TEXT;
  v_step           INTERVAL;
  v_offset         INTERVAL;
  v_series_to      TIMESTAMPTZ;
  v_current        JSON;
  v_previous       JSON;
  v_revenue_series JSON;
BEGIN
  PERFORM set_config('timezone', p_tz, true);

  v_current  := analytics_period_metrics(v_uid, p_from, p_to);
  v_previous := analytics_period_metrics(v_uid, p_prev_from, p_prev_to);

  v_trunc := CASE lower(p_granularity)
               WHEN 'hour'  THEN 'hour'
               WHEN 'week'  THEN 'week'
               WHEN 'month' THEN 'month'
               ELSE 'day'
             END;
  v_step := CASE v_trunc
              WHEN 'hour'  THEN INTERVAL '1 hour'
              WHEN 'week'  THEN INTERVAL '1 week'
              WHEN 'month' THEN INTERVAL '1 month'
              ELSE INTERVAL '1 day'
            END;
  v_offset := p_from - p_prev_from;
  -- Never generate buckets past the current instant (current period is ongoing).
  v_series_to := LEAST(p_to, now());

  WITH buckets AS (
    SELECT gs AS bucket
      FROM generate_series(date_trunc(v_trunc, p_from), v_series_to, v_step) gs
  )
  SELECT json_agg(
           json_build_object(
             'bucket', b.bucket,
             'label',
               CASE v_trunc
                 WHEN 'hour'  THEN to_char(b.bucket, 'HH24:00')
                 WHEN 'week'  THEN to_char(b.bucket, '"W"IW')
                 WHEN 'month' THEN to_char(b.bucket, 'Mon YYYY')
                 ELSE to_char(b.bucket, 'DD Mon')
               END,
             'current', COALESCE((
               SELECT SUM(amount) FROM sale s
                WHERE s.user_id = v_uid
                  AND s.paid_at >= b.bucket
                  AND s.paid_at <  b.bucket + v_step
             ), 0),
             'previous', COALESCE((
               SELECT SUM(amount) FROM sale s
                WHERE s.user_id = v_uid
                  AND s.paid_at >= b.bucket - v_offset
                  AND s.paid_at <  b.bucket + v_step - v_offset
             ), 0)
           )
           ORDER BY b.bucket
         )
    INTO v_revenue_series
    FROM buckets b;

  RETURN json_build_object(
    'current',        v_current,
    'previous',       v_previous,
    'revenue_series', COALESCE(v_revenue_series, '[]'::json)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_analytics_v2(timestamptz, timestamptz, timestamptz, timestamptz, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_analytics_v2(timestamptz, timestamptz, timestamptz, timestamptz, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_v2(timestamptz, timestamptz, timestamptz, timestamptz, text, text) TO authenticated;
