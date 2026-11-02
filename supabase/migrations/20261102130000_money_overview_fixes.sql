-- Two corrections to "Аналитика" (20261102120200_money_overview, already on staging):
--   * "Не заработано" summed appointments.price, but NULL there means "follows the price
--     list" (mobile stores NULL for a visit at list price), so those visits counted as 0.
--     It now falls back to the services' prices, as appointmentTotalPrice does in the app.
--   * A vacation is only one with both ends, as on the public site (isVacationDay):
--     vacation_from alone no longer takes that day out of the open hours.
-- Grants are kept: CREATE OR REPLACE doesn't touch them.

CREATE OR REPLACE FUNCTION public.money_open_minutes(
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
     WHERE (cfg.vacation_from IS NULL OR cfg.vacation_until IS NULL
            OR dates.d < cfg.vacation_from OR dates.d > cfg.vacation_until)
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

CREATE OR REPLACE FUNCTION public.get_money_overview(
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
           'no_shows', COUNT(*) FILTER (WHERE a.status = 'no_show'),
           'client_cancels', COUNT(*) FILTER (WHERE a.status = 'cancelled' AND a.cancelled_by = 'client'),
           'lost', COALESCE(SUM(COALESCE(a.price, (
             SELECT SUM(sv.price) FROM service sv WHERE sv.id = ANY(a.service_ids)
           ))), 0)
         )
    INTO v_loss
    FROM appointments a
   WHERE a.user_id = v_uid
     AND a.start_at >= p_from AND a.start_at < p_to
     AND (a.status = 'no_show' OR (a.status = 'cancelled' AND a.cancelled_by = 'client'));

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
