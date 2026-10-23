-- Analytics V2 dashboard RPC.
--
-- Adds get_analytics_v2 — an extended, single-snapshot analytics function that
-- returns current-period metrics, the equal-length previous period (for % deltas),
-- and chart blocks (top services, client mix, busiest days, revenue time-series).
--
-- The V1 get_analytics function is left intact (Home page still uses it until the
-- analytics V2 page assembly migrates it).
--
-- Security model mirrors V1: SECURITY DEFINER, search_path = public, every query
-- filtered by auth.uid(), EXECUTE restricted to the authenticated role.

-- Composite indexes for the per-user, time-ranged scans this RPC performs.
CREATE INDEX IF NOT EXISTS sale_user_paid_at_idx
  ON public.sale (user_id, paid_at);
CREATE INDEX IF NOT EXISTS appointments_user_status_start_idx
  ON public.appointments (user_id, status, start_at);

-- ---------------------------------------------------------------------------
-- Private helper: scalar metrics for a single (user, range).
-- Returns earned / appointments_count / clients_served / working_minutes / avg_check.
-- Internal only — not granted to anon or authenticated; callable solely from
-- within get_analytics_v2 (which runs as the function owner).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_period_metrics(
  p_uid  UUID,
  p_from TIMESTAMPTZ,
  p_to   TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earned            NUMERIC;
  v_appointments_count INTEGER;
  v_clients_served    INTEGER;
  v_working_minutes   INTEGER;
  v_avg_check         NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
    INTO v_earned
    FROM sale
   WHERE user_id = p_uid
     AND paid_at BETWEEN p_from AND p_to;

  SELECT COUNT(*),
         COALESCE(SUM(duration), 0),
         COUNT(DISTINCT client_id)
    INTO v_appointments_count, v_working_minutes, v_clients_served
    FROM appointments
   WHERE user_id = p_uid
     AND status = 'completed'
     AND start_at BETWEEN p_from AND p_to;

  IF v_appointments_count > 0 THEN
    v_avg_check := ROUND(v_earned / v_appointments_count, 2);
  ELSE
    v_avg_check := NULL;
  END IF;

  RETURN json_build_object(
    'earned',             v_earned,
    'appointments_count', v_appointments_count,
    'clients_served',     v_clients_served,
    'working_minutes',    v_working_minutes,
    'avg_check',          v_avg_check
  );
END;
$$;

REVOKE ALL ON FUNCTION public.analytics_period_metrics(uuid, timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_period_metrics(uuid, timestamptz, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_period_metrics(uuid, timestamptz, timestamptz) FROM authenticated;

-- ---------------------------------------------------------------------------
-- Public RPC: get_analytics_v2
--
-- p_tz is the master's IANA timezone (e.g. 'Asia/Almaty'). Day-of-week, hour, and
-- time-series bucket boundaries are computed in this zone so they reflect the
-- master's local wall clock. Period filtering uses absolute instants and is
-- timezone-independent. Defaults to 'UTC'.
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
  v_uid           UUID := auth.uid();
  v_earned        NUMERIC;
  v_trunc         TEXT;
  v_step          INTERVAL;
  v_offset        INTERVAL;
  v_current       JSON;
  v_previous      JSON;
  v_top_services  JSON;
  v_client_mix    JSON;
  v_busiest_days  JSON;
  v_peak_hour     INTEGER;
  v_revenue_series JSON;
BEGIN
  -- Pin the session timezone so date_trunc / EXTRACT / to_char below run in the
  -- master's local zone (weekday, hour-of-day, bucket alignment). Scoped to this
  -- transaction only (is_local = true). Period filtering stays absolute.
  PERFORM set_config('timezone', p_tz, true);

  -- Scalar metrics for both periods (identical shape).
  v_current  := analytics_period_metrics(v_uid, p_from, p_to);
  v_previous := analytics_period_metrics(v_uid, p_prev_from, p_prev_to);

  v_earned := (v_current ->> 'earned')::NUMERIC;

  -- Top services (current period only), revenue from sale_item, colour from service.
  SELECT json_agg(t ORDER BY t.revenue DESC)
    INTO v_top_services
    FROM (
      SELECT
        si.name_snapshot AS name,
        SUM(si.price_snapshot) AS revenue,
        CASE
          WHEN v_earned > 0
          THEN ROUND(SUM(si.price_snapshot) / v_earned * 100)
          ELSE 0
        END AS percentage,
        COUNT(*) AS count,
        COALESCE(MAX(sv.color), '#a1a1aa') AS color
        FROM sale_item si
        JOIN sale s ON s.id = si.sale_id
        LEFT JOIN service sv ON sv.id = si.service_id
       WHERE s.user_id = v_uid
         AND s.paid_at BETWEEN p_from AND p_to
       GROUP BY si.name_snapshot
       ORDER BY revenue DESC
       LIMIT 6
    ) t;

  -- Client mix: of clients served in the period, how many are first-timers.
  -- A client is "new" when their earliest completed appointment falls in the
  -- period; otherwise "returning". (A served client always has min <= p_to.)
  WITH served AS (
    SELECT DISTINCT client_id
      FROM appointments
     WHERE user_id = v_uid
       AND status = 'completed'
       AND start_at BETWEEN p_from AND p_to
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
           'new',       COUNT(*) FILTER (WHERE first_at BETWEEN p_from AND p_to),
           'returning', COUNT(*) FILTER (WHERE first_at < p_from),
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
         AND start_at BETWEEN p_from AND p_to
    ) d;

  -- Peak hour: hour-of-day with the most completed appointments in the period.
  SELECT EXTRACT(HOUR FROM start_at)::INT AS hr
    INTO v_peak_hour
    FROM appointments
   WHERE user_id = v_uid
     AND status = 'completed'
     AND start_at BETWEEN p_from AND p_to
   GROUP BY hr
   ORDER BY COUNT(*) DESC, hr ASC
   LIMIT 1;

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
    'top_services',   COALESCE(v_top_services, '[]'::json),
    'client_mix',     COALESCE(v_client_mix, json_build_object('new', 0, 'returning', 0, 'total', 0)),
    'busiest_days',   v_busiest_days,
    'peak_hour_from', v_peak_hour,
    'peak_hour_to',   CASE WHEN v_peak_hour IS NULL THEN NULL ELSE v_peak_hour + 1 END,
    'revenue_series', COALESCE(v_revenue_series, '[]'::json)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_analytics_v2(timestamptz, timestamptz, timestamptz, timestamptz, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_analytics_v2(timestamptz, timestamptz, timestamptz, timestamptz, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_v2(timestamptz, timestamptz, timestamptz, timestamptz, text, text) TO authenticated;
