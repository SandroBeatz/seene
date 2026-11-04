-- Auto-complete (design AppEventUpcoming, AppEventDoneAuto): when it is on, a confirmed visit
-- completes by itself when its time is over, with its own amount and the chosen payment method.
-- auto_complete_since: when it was turned on (NULL = off). Only visits ending after that moment
-- complete, so turning it on doesn't close every old visit nobody finished.
ALTER TABLE public.master_settings
  ADD COLUMN auto_complete_since timestamptz,
  ADD COLUMN auto_complete_payment_type_id uuid
    REFERENCES public.payment_type (id) ON DELETE SET NULL;

ALTER TABLE public.appointments
  ADD COLUMN auto_completed boolean NOT NULL DEFAULT false;

-- complete_appointment's body, for any master: the caller vouches for p_user_id.
CREATE FUNCTION public.finish_visit(
  p_user_id         uuid,
  p_appointment_id  uuid,
  p_amount          numeric,
  p_payment_type_id uuid,
  p_items           jsonb,
  p_start_at        timestamptz,
  p_duration        integer,
  p_tip             numeric,
  p_auto            boolean
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_sale_id   UUID;
  v_user_id   UUID;
  v_client_id UUID;
  v_status    TEXT;
  v_start_at  TIMESTAMPTZ;
  v_item      JSONB;
  v_use       RECORD;
  v_stock     NUMERIC;
  v_delta     NUMERIC;
BEGIN
  SELECT user_id, client_id, status, COALESCE(p_start_at, start_at)
    INTO v_user_id, v_client_id, v_status, v_start_at
    FROM appointments
   WHERE id = p_appointment_id
     AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'appointment_not_found';
  END IF;

  IF v_status IN ('cancelled', 'no_show') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  IF EXISTS (SELECT 1 FROM sale WHERE appointment_id = p_appointment_id) THEN
    RAISE EXCEPTION 'already_completed';
  END IF;

  IF p_amount IS NULL OR p_amount < 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  IF p_tip IS NULL OR p_tip < 0 OR p_tip > p_amount THEN
    RAISE EXCEPTION 'invalid_tip';
  END IF;

  IF p_duration IS NOT NULL AND (p_duration < 5 OR p_duration > 1440) THEN
    RAISE EXCEPTION 'invalid_duration';
  END IF;

  IF p_payment_type_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM payment_type WHERE id = p_payment_type_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'payment_type_not_found';
  END IF;

  UPDATE appointments
     SET status         = 'completed',
         auto_completed = p_auto,
         start_at       = v_start_at,
         duration       = COALESCE(p_duration, duration),
         updated_at     = now()
   WHERE id = p_appointment_id;

  -- paid_at = the visit's (actual) start, so revenue lands in the period the
  -- service was delivered even when closed out later.
  INSERT INTO sale (user_id, appointment_id, client_id, payment_type_id, amount, tip, paid_at)
  VALUES (v_user_id, p_appointment_id, v_client_id, p_payment_type_id, p_amount, p_tip, v_start_at)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'))
  LOOP
    INSERT INTO sale_item (sale_id, service_id, name_snapshot, price_snapshot)
    VALUES (
      v_sale_id,
      NULLIF(v_item->>'service_id', '')::UUID,
      v_item->>'name',
      (v_item->>'price')::NUMERIC
    );
  END LOOP;

  FOR v_use IN
    SELECT ps.product_id, sum(ps.quantity) AS quantity
      FROM sale_item si
      JOIN product_service ps ON ps.service_id = si.service_id
     WHERE si.sale_id = v_sale_id
     GROUP BY ps.product_id
     ORDER BY ps.product_id
  LOOP
    SELECT stock INTO v_stock FROM product WHERE id = v_use.product_id FOR UPDATE;
    v_delta := GREATEST(v_stock - v_use.quantity, 0) - v_stock;
    IF v_delta <> 0 THEN
      UPDATE product SET stock = stock + v_delta, updated_at = now() WHERE id = v_use.product_id;
      INSERT INTO stock_movement (user_id, product_id, delta, reason, sale_id)
      VALUES (v_user_id, v_use.product_id, v_delta, 'visit', v_sale_id);
    END IF;
  END LOOP;

  RETURN v_sale_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.finish_visit(uuid, uuid, numeric, uuid, jsonb, timestamptz, integer, numeric, boolean)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.complete_appointment(
  p_appointment_id  uuid,
  p_amount          numeric,
  p_payment_type_id uuid,
  p_items           jsonb,
  p_start_at        timestamptz DEFAULT NULL,
  p_duration        integer     DEFAULT NULL,
  p_tip             numeric     DEFAULT 0
)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT public.finish_visit(
    auth.uid(), p_appointment_id, p_amount, p_payment_type_id, p_items,
    p_start_at, p_duration, p_tip, false
  );
$function$;

CREATE FUNCTION public.auto_complete_visits()
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_visit RECORD;
  v_items jsonb;
  v_total numeric;
  v_done  integer := 0;
BEGIN
  FOR v_visit IN
    SELECT a.id, a.user_id, a.service_ids, a.price, ms.auto_complete_payment_type_id
      FROM appointments a
      JOIN master_settings ms ON ms.user_id = a.user_id
     WHERE ms.auto_complete_since IS NOT NULL
       AND a.status = 'confirmed'
       AND a.start_at + make_interval(mins => a.duration) <= now()
       AND a.start_at + make_interval(mins => a.duration) >= ms.auto_complete_since
       AND NOT EXISTS (SELECT 1 FROM sale s WHERE s.appointment_id = a.id)
     ORDER BY a.start_at
     LIMIT 500
  LOOP
    -- One bad visit doesn't hold up the others.
    BEGIN
      SELECT COALESCE(
               jsonb_agg(
                 jsonb_build_object('service_id', s.id, 'name', s.name, 'price', s.price)
                 ORDER BY picked.position
               ),
               '[]'::jsonb
             ),
             COALESCE(sum(s.price), 0)
        INTO v_items, v_total
        FROM unnest(v_visit.service_ids) WITH ORDINALITY AS picked(id, position)
        JOIN service s ON s.id = picked.id;

      PERFORM public.finish_visit(
        v_visit.user_id,
        v_visit.id,
        COALESCE(v_visit.price, v_total),
        COALESCE(
          v_visit.auto_complete_payment_type_id,
          (SELECT pt.id
             FROM payment_type pt
            WHERE pt.user_id = v_visit.user_id AND pt.is_active
            ORDER BY pt.is_default DESC, pt.sort_order
            LIMIT 1)
        ),
        v_items,
        NULL,
        NULL,
        0,
        true
      );
      v_done := v_done + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'auto_complete_visits: visit % failed: %', v_visit.id, SQLERRM;
    END;
  END LOOP;
  RETURN v_done;
END;
$function$;

REVOKE ALL ON FUNCTION public.auto_complete_visits() FROM PUBLIC, anon, authenticated;

-- cron.schedule upserts by job name, so re-running is safe.
SELECT cron.schedule(
  'auto-complete-visits',
  '*/5 * * * *',
  $job$ SELECT public.auto_complete_visits(); $job$
);
