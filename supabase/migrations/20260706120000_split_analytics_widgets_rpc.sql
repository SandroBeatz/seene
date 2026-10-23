-- Split the fixed-window widget blocks out of get_analytics_v2.
--
-- Top services / client mix / busiest days no longer follow the dashboard's
-- global date filter — each has its own fixed rolling window (30 days / 90
-- days / 8 weeks, computed client-side). Keeping them inside get_analytics_v2
-- meant recomputing all three on every period switch and coupling them to the
-- filter range, so:
--
--   * get_analytics_v2 (same signature) now returns only the filter-driven
--     blocks: current / previous scalar metrics and the revenue time-series.
--   * get_analytics_widgets_v2 (new) returns top_services, client_mix,
--     busiest_days and the peak-hour window, each computed over its own range.
--
-- Only the feature/analytics frontend calls get_analytics_v2, so reshaping its
-- result JSON is safe. Security model mirrors the original: SECURITY DEFINER,
-- search_path = public, auth.uid() filtering, EXECUTE for authenticated only.

-- ---------------------------------------------------------------------------
-- get_analytics_v2 — slimmed to the filter-driven blocks.
-- ---------------------------------------------------------------------------
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
  v_current        JSON;
  v_previous       JSON;
  v_revenue_series JSON;
BEGIN
  -- Pin the session timezone so date_trunc / to_char below run in the master's
  -- local zone (bucket alignment, labels). Scoped to this transaction only.
  PERFORM set_config('timezone', p_tz, true);

  -- Scalar metrics for both periods (identical shape).
  v_current  := analytics_period_metrics(v_uid, p_from, p_to);
  v_previous := analytics_period_metrics(v_uid, p_prev_from, p_prev_to);

  -- Revenue time-series: bucket the period by granularity; previous-period value
  -- aligned to the same buckets, shifted back by the period offset.
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

  WITH buckets AS (
    SELECT gs AS bucket
      FROM generate_series(date_trunc(v_trunc, p_from), p_to, v_step) gs
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

-- ---------------------------------------------------------------------------
-- get_analytics_widgets_v2 — fixed-window widget blocks, one range per widget.
--
--   p_top_from  / p_top_to   top services window (last 30 days)
--   p_mix_from  / p_mix_to   client mix window (last 90 days)
--   p_days_from / p_days_to  busiest days + peak hours window (last 8 weeks)
--
-- The windows are computed client-side so this function stays a pure
-- range-parametrised query, like get_analytics_v2.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_widgets_v2(
  p_top_from  TIMESTAMPTZ,
  p_top_to    TIMESTAMPTZ,
  p_mix_from  TIMESTAMPTZ,
  p_mix_to    TIMESTAMPTZ,
  p_days_from TIMESTAMPTZ,
  p_days_to   TIMESTAMPTZ,
  p_tz        TEXT DEFAULT 'UTC'
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          UUID := auth.uid();
  v_top_earned   NUMERIC;
  v_top_services JSON;
  v_client_mix   JSON;
  v_busiest_days JSON;
  v_peak_hour    INTEGER;
BEGIN
  -- Weekday / hour extraction below must reflect the master's local wall clock.
  PERFORM set_config('timezone', p_tz, true);

  -- Total revenue inside the top-services window — the base for percentages.
  SELECT COALESCE(SUM(amount), 0)
    INTO v_top_earned
    FROM sale
   WHERE user_id = v_uid
     AND paid_at BETWEEN p_top_from AND p_top_to;

  -- Top services, revenue from sale_item, colour from service.
  SELECT json_agg(t ORDER BY t.revenue DESC)
    INTO v_top_services
    FROM (
      SELECT
        si.name_snapshot AS name,
        SUM(si.price_snapshot) AS revenue,
        CASE
          WHEN v_top_earned > 0
          THEN ROUND(SUM(si.price_snapshot) / v_top_earned * 100)
          ELSE 0
        END AS percentage,
        COUNT(*) AS count,
        COALESCE(MAX(sv.color), '#a1a1aa') AS color
        FROM sale_item si
        JOIN sale s ON s.id = si.sale_id
        LEFT JOIN service sv ON sv.id = si.service_id
       WHERE s.user_id = v_uid
         AND s.paid_at BETWEEN p_top_from AND p_top_to
       GROUP BY si.name_snapshot
       ORDER BY revenue DESC
       LIMIT 6
    ) t;

  -- Client mix: of clients served in the window, how many are first-timers.
  -- A client is "new" when their earliest completed appointment falls in the
  -- window; otherwise "returning".
  WITH served AS (
    SELECT DISTINCT client_id
      FROM appointments
     WHERE user_id = v_uid
       AND status = 'completed'
       AND start_at BETWEEN p_mix_from AND p_mix_to
  ),
  firsts AS (
    SELECT a.client_id, MIN(a.start_at) AS first_at
      FROM appointments a
     WHERE a.user_id = v_uid
       AND a.status = 'completed'
       AND a.client_id IN (SELECT client_id FROM served)
     GROUP BY a.client_id
  )
  SELECT json_build_object(
           'new',       COUNT(*) FILTER (WHERE first_at BETWEEN p_mix_from AND p_mix_to),
           'returning', COUNT(*) FILTER (WHERE first_at < p_mix_from),
           'total',     COUNT(*)
         )
    INTO v_client_mix
    FROM firsts;

  -- Busiest days: completed appointments per ISO weekday, as a 7-element array
  -- ordered Mon..Sun (index 0 = Monday).
  SELECT json_build_array(
           COUNT(*) FILTER (WHERE dow = 1),
           COUNT(*) FILTER (WHERE dow = 2),
           COUNT(*) FILTER (WHERE dow = 3),
           COUNT(*) FILTER (WHERE dow = 4),
           COUNT(*) FILTER (WHERE dow = 5),
           COUNT(*) FILTER (WHERE dow = 6),
           COUNT(*) FILTER (WHERE dow = 7)
         )
    INTO v_busiest_days
    FROM (
      SELECT EXTRACT(ISODOW FROM start_at)::INT AS dow
        FROM appointments
       WHERE user_id = v_uid
         AND status = 'completed'
         AND start_at BETWEEN p_days_from AND p_days_to
    ) d;

  -- Peak hour: hour-of-day with the most completed appointments in the window.
  SELECT EXTRACT(HOUR FROM start_at)::INT AS hr
    INTO v_peak_hour
    FROM appointments
   WHERE user_id = v_uid
     AND status = 'completed'
     AND start_at BETWEEN p_days_from AND p_days_to
   GROUP BY hr
   ORDER BY COUNT(*) DESC, hr ASC
   LIMIT 1;

  RETURN json_build_object(
    'top_services',   COALESCE(v_top_services, '[]'::json),
    'client_mix',     COALESCE(v_client_mix, json_build_object('new', 0, 'returning', 0, 'total', 0)),
    'busiest_days',   v_busiest_days,
    'peak_hour_from', v_peak_hour,
    'peak_hour_to',   CASE WHEN v_peak_hour IS NULL THEN NULL ELSE v_peak_hour + 1 END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_analytics_widgets_v2(timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_analytics_widgets_v2(timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_widgets_v2(timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, text) TO authenticated;
