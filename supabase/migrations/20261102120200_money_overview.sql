-- "Аналитика" of the mobile app: everything the screen shows for one period, in one
-- call, plus the client list behind "Все". Periods are half-open [from, to) and every
-- local boundary (days, weekdays, hours) is in the master's zone p_tz.
--
-- Replaces get_analytics_v2 / get_analytics_widgets_v2: no client ever called them.

DROP FUNCTION IF EXISTS public.get_analytics_v2(timestamptz, timestamptz, timestamptz, timestamptz, text, text);
DROP FUNCTION IF EXISTS public.get_analytics_widgets_v2(timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, text);
DROP FUNCTION IF EXISTS public.analytics_period_metrics(uuid, timestamptz, timestamptz);

-- Minutes the master was open within [p_from, p_to), up to now: working hours minus
-- breaks, vacation and personal time. NULL when a stored time can't be read.
CREATE FUNCTION public.money_open_minutes(
  p_uid  uuid,
  p_from timestamptz,
  p_to   timestamptz,
  p_tz   text
)
  RETURNS integer
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_to      TIMESTAMPTZ := LEAST(p_to, now());
  v_minutes INTEGER;
BEGIN
  IF p_from >= v_to THEN
    RETURN 0;
  END IF;

  WITH cfg AS (
    SELECT mp.schedule->'days' AS days, ms.vacation_from, ms.vacation_until
      FROM master_profile mp
      LEFT JOIN master_settings ms ON ms.user_id = mp.user_id
     WHERE mp.user_id = p_uid
  ),
  dates AS (
    SELECT gs::date AS d
      FROM generate_series(
             (p_from AT TIME ZONE p_tz)::date,
             (v_to   AT TIME ZONE p_tz)::date,
             INTERVAL '1 day'
           ) gs
  ),
  workdays AS (
    SELECT dates.d, cfg.days -> trim(to_char(dates.d, 'fmday')) AS day
      FROM dates CROSS JOIN cfg
     WHERE (cfg.vacation_from IS NULL OR dates.d < cfg.vacation_from
            OR dates.d > COALESCE(cfg.vacation_until, cfg.vacation_from))
  ),
  hours AS (
    SELECT tstzmultirange(tstzrange(
               (w.d + (w.day->>'start')::time) AT TIME ZONE p_tz,
               (w.d + (w.day->>'end')::time)   AT TIME ZONE p_tz))
           - COALESCE((
               SELECT range_agg(tstzrange(
                        (w.d + (b->>'start')::time) AT TIME ZONE p_tz,
                        (w.d + (b->>'end')::time)   AT TIME ZONE p_tz))
                 FROM jsonb_array_elements(COALESCE(w.day->'breaks', '[]'::jsonb)) b
                WHERE (b->>'start')::time < (b->>'end')::time
             ), '{}'::tstzmultirange) AS open
      FROM workdays w
     WHERE (w.day->>'enabled')::boolean
       AND (w.day->>'start')::time < (w.day->>'end')::time
  ),
  blocks AS (
    SELECT COALESCE(range_agg(tstzrange(start_at, end_at)), '{}'::tstzmultirange) AS busy
      FROM time_block
     WHERE user_id = p_uid
       AND start_at < v_to
       AND end_at   > p_from
       AND start_at < end_at
  ),
  spans AS (
    SELECT unnest(
             (h.open - blocks.busy) * tstzmultirange(tstzrange(p_from, v_to))
           ) AS span
      FROM hours h CROSS JOIN blocks
  )
  SELECT COALESCE(SUM(EXTRACT(EPOCH FROM upper(span) - lower(span))) / 60, 0)::INT
    INTO v_minutes
    FROM spans;

  RETURN v_minutes;
EXCEPTION WHEN data_exception THEN
  RETURN NULL;
END;
$function$;

-- The numbers of one period: both the shown one and the one it is compared with.
CREATE FUNCTION public.money_period_metrics(
  p_uid  uuid,
  p_from timestamptz,
  p_to   timestamptz,
  p_tz   text
)
  RETURNS json
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_earned      NUMERIC;
  v_tips        NUMERIC;
  v_visits      INTEGER;
  v_booked      INTEGER;
  v_no_shows    INTEGER;
  v_new_clients INTEGER;
  v_spent       NUMERIC;
  v_open        INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(tip), 0)
    INTO v_earned, v_tips
    FROM sale
   WHERE user_id = p_uid AND paid_at >= p_from AND paid_at < p_to;

  SELECT COUNT(*) FILTER (WHERE status = 'completed'),
         COALESCE(SUM(duration) FILTER (WHERE status = 'completed'), 0),
         COUNT(*) FILTER (WHERE status = 'no_show')
    INTO v_visits, v_booked, v_no_shows
    FROM appointments
   WHERE user_id = p_uid AND start_at >= p_from AND start_at < p_to;

  -- A client is new in the period their first ever finished visit falls in.
  SELECT COUNT(*)
    INTO v_new_clients
    FROM (
      SELECT client_id
        FROM appointments
       WHERE user_id = p_uid AND status = 'completed'
       GROUP BY client_id
      HAVING MIN(start_at) >= p_from AND MIN(start_at) < p_to
    ) firsts;

  SELECT COALESCE(SUM(amount), 0)
    INTO v_spent
    FROM expense
   WHERE user_id = p_uid
     AND spent_on >= (p_from AT TIME ZONE p_tz)::date
     AND spent_on <= ((p_to - INTERVAL '1 microsecond') AT TIME ZONE p_tz)::date;

  v_open := money_open_minutes(p_uid, p_from, p_to, p_tz);

  RETURN json_build_object(
    'earned',       v_earned,
    'tips',         v_tips,
    'visits',       v_visits,
    'avg_check',    CASE WHEN v_visits > 0 THEN ROUND(v_earned / v_visits) END,
    'no_shows',     v_no_shows,
    'new_clients',  v_new_clients,
    'spent',        v_spent,
    'load_pct',     CASE WHEN v_open > 0 THEN LEAST(100, ROUND(v_booked * 100.0 / v_open)) END,
    'free_minutes', CASE WHEN v_open > 0 THEN GREATEST(0, v_open - v_booked) END
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.money_open_minutes(uuid, timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.money_open_minutes(uuid, timestamptz, timestamptz, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.money_period_metrics(uuid, timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.money_period_metrics(uuid, timestamptz, timestamptz, text) FROM anon, authenticated;

CREATE FUNCTION public.get_money_overview(
  p_from        timestamptz,
  p_to          timestamptz,
  p_prev_from   timestamptz,
  p_prev_to     timestamptz,
  p_granularity text DEFAULT 'day',
  p_tz          text DEFAULT 'UTC'
)
  RETURNS json
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_uid     UUID := auth.uid();
  v_trunc   TEXT := CASE WHEN p_granularity = 'month' THEN 'month' ELSE 'day' END;
  v_step    INTERVAL := CASE WHEN p_granularity = 'month' THEN INTERVAL '1 month' ELSE INTERVAL '1 day' END;
  v_series  JSON;
  v_exp     JSON;
  v_pay     JSON;
  v_top     JSON;
  v_items   NUMERIC;
  v_mix     JSON;
  v_tops    JSON;
  v_busy    JSON;
  v_peak    INTEGER;
  v_loss    JSON;
BEGIN
  -- date_trunc, EXTRACT and generate_series below read the master's wall clock.
  PERFORM set_config('timezone', p_tz, true);

  SELECT json_agg(json_build_object('day', to_char(b.bucket, 'YYYY-MM-DD'), 'amount', b.amount) ORDER BY b.bucket)
    INTO v_series
    FROM (
      SELECT gs AS bucket, COALESCE((
               SELECT SUM(s.amount) FROM sale s
                WHERE s.user_id = v_uid
                  AND s.paid_at >= gs AND s.paid_at < gs + v_step
                  AND s.paid_at >= p_from AND s.paid_at < p_to
             ), 0) AS amount
        FROM generate_series(date_trunc(v_trunc, p_from), p_to - INTERVAL '1 microsecond', v_step) gs
    ) b;

  SELECT json_agg(json_build_object('category', e.category, 'amount', e.amount) ORDER BY e.amount DESC)
    INTO v_exp
    FROM (
      SELECT category, SUM(amount) AS amount
        FROM expense
       WHERE user_id = v_uid
         AND spent_on >= p_from::date
         AND spent_on <= (p_to - INTERVAL '1 microsecond')::date
       GROUP BY category
    ) e;

  SELECT json_agg(json_build_object('kind', p.kind, 'name', p.name, 'amount', p.amount) ORDER BY p.amount DESC)
    INTO v_pay
    FROM (
      SELECT pt.kind, pt.name, SUM(s.amount) AS amount
        FROM sale s
        LEFT JOIN payment_type pt ON pt.id = s.payment_type_id
       WHERE s.user_id = v_uid AND s.paid_at >= p_from AND s.paid_at < p_to
       GROUP BY pt.kind, pt.name
    ) p;

  SELECT COALESCE(SUM(si.price_snapshot), 0)
    INTO v_items
    FROM sale_item si
    JOIN sale s ON s.id = si.sale_id
   WHERE s.user_id = v_uid AND s.paid_at >= p_from AND s.paid_at < p_to;

  SELECT json_agg(json_build_object('name', t.name, 'revenue', t.revenue, 'count', t.count, 'color', t.color) ORDER BY t.revenue DESC)
    INTO v_top
    FROM (
      SELECT si.name_snapshot AS name,
             SUM(si.price_snapshot) AS revenue,
             COUNT(*) AS count,
             MAX(sv.color) AS color
        FROM sale_item si
        JOIN sale s ON s.id = si.sale_id
        LEFT JOIN service sv ON sv.id = si.service_id
       WHERE s.user_id = v_uid AND s.paid_at >= p_from AND s.paid_at < p_to
       GROUP BY si.name_snapshot
       ORDER BY revenue DESC
       LIMIT 4
    ) t;

  WITH served AS (
    SELECT client_id, MIN(start_at) AS first_in_period
      FROM appointments
     WHERE user_id = v_uid AND status = 'completed'
       AND start_at >= p_from AND start_at < p_to
     GROUP BY client_id
  ), ever AS (
    SELECT a.client_id, MIN(a.start_at) AS first_ever
      FROM appointments a
     WHERE a.user_id = v_uid AND a.status = 'completed'
       AND a.client_id IN (SELECT client_id FROM served)
     GROUP BY a.client_id
  )
  SELECT json_build_object(
           'total',     COUNT(*),
           'new',       COUNT(*) FILTER (WHERE first_ever >= p_from),
           'returning', COUNT(*) FILTER (WHERE first_ever <  p_from)
         )
    INTO v_mix
    FROM ever;

  SELECT json_agg(json_build_object(
           'client_id', t.client_id, 'first_name', c.first_name, 'last_name', c.last_name,
           'avatar_color', c.avatar_color, 'visits', t.visits, 'amount', t.amount
         ) ORDER BY t.amount DESC)
    INTO v_tops
    FROM (
      SELECT client_id, COUNT(*) AS visits, SUM(amount) AS amount
        FROM sale
       WHERE user_id = v_uid AND paid_at >= p_from AND paid_at < p_to
       GROUP BY client_id
       ORDER BY amount DESC
       LIMIT 3
    ) t
    JOIN client c ON c.id = t.client_id;

  SELECT json_build_array(
           COUNT(*) FILTER (WHERE dow = 1), COUNT(*) FILTER (WHERE dow = 2),
           COUNT(*) FILTER (WHERE dow = 3), COUNT(*) FILTER (WHERE dow = 4),
           COUNT(*) FILTER (WHERE dow = 5), COUNT(*) FILTER (WHERE dow = 6),
           COUNT(*) FILTER (WHERE dow = 7)
         )
    INTO v_busy
    FROM (
      SELECT EXTRACT(ISODOW FROM start_at)::INT AS dow
        FROM appointments
       WHERE user_id = v_uid AND status = 'completed'
         AND start_at >= p_from AND start_at < p_to
    ) d;

  SELECT EXTRACT(HOUR FROM start_at)::INT AS hr
    INTO v_peak
    FROM appointments
   WHERE user_id = v_uid AND status = 'completed'
     AND start_at >= p_from AND start_at < p_to
   GROUP BY hr
   ORDER BY COUNT(*) DESC, hr ASC
   LIMIT 1;

  SELECT json_build_object(
           'no_shows', COUNT(*) FILTER (WHERE status = 'no_show'),
           'client_cancels', COUNT(*) FILTER (WHERE status = 'cancelled' AND cancelled_by = 'client'),
           'lost', COALESCE(SUM(price), 0)
         )
    INTO v_loss
    FROM appointments
   WHERE user_id = v_uid
     AND start_at >= p_from AND start_at < p_to
     AND (status = 'no_show' OR (status = 'cancelled' AND cancelled_by = 'client'));

  RETURN json_build_object(
    'current',      money_period_metrics(v_uid, p_from, p_to, p_tz),
    'previous',     money_period_metrics(v_uid, p_prev_from, p_prev_to, p_tz),
    'series',       COALESCE(v_series, '[]'::json),
    'expenses',     COALESCE(v_exp, '[]'::json),
    'payments',     COALESCE(v_pay, '[]'::json),
    'top_services', COALESCE(v_top, '[]'::json),
    'services_total', v_items,
    'clients',      v_mix,
    'top_clients',  COALESCE(v_tops, '[]'::json),
    'busy_days',    v_busy,
    'peak_hour',    v_peak,
    'losses',       v_loss
  );
END;
$function$;

-- "Клиенты за период": everyone who paid in the period, biggest first.
CREATE FUNCTION public.get_money_clients(
  p_from timestamptz,
  p_to   timestamptz
)
  RETURNS TABLE (
    client_id    uuid,
    first_name   text,
    last_name    text,
    avatar_color text,
    visits       integer,
    last_visit   timestamptz,
    amount       numeric,
    is_new       boolean
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT s.client_id, c.first_name, c.last_name, c.avatar_color,
         COUNT(*)::INT, MAX(s.paid_at), SUM(s.amount),
         NOT EXISTS (
           SELECT 1 FROM appointments a
            WHERE a.user_id = auth.uid() AND a.client_id = s.client_id
              AND a.status = 'completed' AND a.start_at < p_from
         )
    FROM sale s
    JOIN client c ON c.id = s.client_id
   WHERE s.user_id = auth.uid() AND s.paid_at >= p_from AND s.paid_at < p_to
   GROUP BY s.client_id, c.first_name, c.last_name, c.avatar_color
   ORDER BY SUM(s.amount) DESC;
$function$;

REVOKE ALL ON FUNCTION public.get_money_overview(timestamptz, timestamptz, timestamptz, timestamptz, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_money_overview(timestamptz, timestamptz, timestamptz, timestamptz, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_money_overview(timestamptz, timestamptz, timestamptz, timestamptz, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_money_clients(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_money_clients(timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_money_clients(timestamptz, timestamptz) TO authenticated;
