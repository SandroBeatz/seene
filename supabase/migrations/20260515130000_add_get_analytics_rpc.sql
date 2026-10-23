-- supabase/migrations/20260515130000_add_get_analytics_rpc.sql

CREATE OR REPLACE FUNCTION get_analytics(p_from TIMESTAMPTZ, p_to TIMESTAMPTZ)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earned         NUMERIC;
  v_completed_count INTEGER;
  v_working_minutes INTEGER;
  v_avg_check      NUMERIC;
  v_top_services   JSON;
BEGIN
  -- Earnings from sales paid in the period
  SELECT COALESCE(SUM(amount), 0)
    INTO v_earned
    FROM sale
   WHERE user_id = auth.uid()
     AND paid_at BETWEEN p_from AND p_to;

  -- Completed appointments in the period
  SELECT COUNT(*), COALESCE(SUM(duration), 0)
    INTO v_completed_count, v_working_minutes
    FROM appointments
   WHERE user_id = auth.uid()
     AND status = 'completed'
     AND start_at BETWEEN p_from AND p_to;

  -- Average check (NULL when no completed appointments)
  IF v_completed_count > 0 THEN
    v_avg_check := v_earned / v_completed_count;
  ELSE
    v_avg_check := NULL;
  END IF;

  -- Top 5 services by revenue in the period
  SELECT json_agg(t ORDER BY t.revenue DESC)
    INTO v_top_services
    FROM (
      SELECT
        si.name_snapshot                                                     AS name,
        SUM(si.price_snapshot)                                               AS revenue,
        CASE
          WHEN v_earned > 0
          THEN ROUND(SUM(si.price_snapshot) / v_earned * 100)
          ELSE 0
        END                                                                  AS percentage
        FROM sale_item si
        JOIN sale s ON s.id = si.sale_id
       WHERE s.user_id = auth.uid()
         AND s.paid_at BETWEEN p_from AND p_to
       GROUP BY si.name_snapshot
       ORDER BY revenue DESC
       LIMIT 5
    ) t;

  RETURN json_build_object(
    'earned',          v_earned,
    'completed_count', v_completed_count,
    'working_minutes', v_working_minutes,
    'avg_check',       v_avg_check,
    'top_services',    COALESCE(v_top_services, '[]'::json)
  );
END;
$$;
