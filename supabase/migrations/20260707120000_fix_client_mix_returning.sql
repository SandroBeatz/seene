-- Fix the "Client mix" widget classification.
--
-- Previously a client counted as "returning" only when their FIRST-EVER completed
-- appointment predated the 90-day window (first_at < p_mix_from). For masters whose
-- clients all first appeared within the window, everyone was labelled "new"
-- (e.g. 10 new / 0 returning) even when most were regulars.
--
-- New rule: among clients served (completed) inside the window, a client is
--   * "returning" when they have >= 2 completed appointments all-time (came back),
--   * "new"       when they have exactly 1 completed appointment all-time.
--
-- Only the client_mix CTE changes; the rest of get_analytics_widgets_v2 is intact.
-- Security model unchanged: SECURITY DEFINER, search_path = public, auth.uid()
-- filtering, EXECUTE for authenticated only.

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

  -- Client mix: of clients served (completed) in the window, split by whether
  -- they are one-time ("new") or repeat ("returning") clients, judged over their
  -- entire completed-appointment history — not just the window.
  WITH served AS (
    SELECT DISTINCT client_id
      FROM appointments
     WHERE user_id = v_uid
       AND status = 'completed'
       AND start_at BETWEEN p_mix_from AND p_mix_to
  ),
  visit_counts AS (
    SELECT a.client_id, COUNT(*) AS cnt
      FROM appointments a
     WHERE a.user_id = v_uid
       AND a.status = 'completed'
       AND a.client_id IN (SELECT client_id FROM served)
     GROUP BY a.client_id
  )
  SELECT json_build_object(
           'new',       COUNT(*) FILTER (WHERE cnt = 1),
           'returning', COUNT(*) FILTER (WHERE cnt >= 2),
           'total',     COUNT(*)
         )
    INTO v_client_mix
    FROM visit_counts;

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
