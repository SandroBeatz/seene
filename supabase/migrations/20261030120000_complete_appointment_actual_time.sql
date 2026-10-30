-- Checkout records the visit as it actually happened. The mobile "Завершить" sheet
-- lets the master correct the start and length when the visit ran early or late;
-- the appointment then holds the real time, so the schedule, working minutes in
-- get_analytics and sale.paid_at all follow it. Both new params default to NULL
-- (keep the planned time), so existing callers are unaffected.
--
-- Also: the payment method must belong to the same master (SECURITY DEFINER
-- otherwise lets a caller attach another master's method by id), and a
-- cancelled or no-show visit cannot be checked out.

DROP FUNCTION IF EXISTS public.complete_appointment(uuid, numeric, uuid, jsonb);

CREATE FUNCTION public.complete_appointment(
  p_appointment_id  uuid,
  p_amount          numeric,
  p_payment_type_id uuid,
  p_items           jsonb,
  p_start_at        timestamptz DEFAULT NULL,
  p_duration        integer     DEFAULT NULL
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
BEGIN
  SELECT user_id, client_id, status, COALESCE(p_start_at, start_at)
    INTO v_user_id, v_client_id, v_status, v_start_at
    FROM appointments
   WHERE id = p_appointment_id
     AND user_id = auth.uid();

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

  IF p_duration IS NOT NULL AND (p_duration < 5 OR p_duration > 1440) THEN
    RAISE EXCEPTION 'invalid_duration';
  END IF;

  IF p_payment_type_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM payment_type WHERE id = p_payment_type_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'payment_type_not_found';
  END IF;

  UPDATE appointments
     SET status     = 'completed',
         start_at   = v_start_at,
         duration   = COALESCE(p_duration, duration),
         updated_at = now()
   WHERE id = p_appointment_id;

  -- paid_at = the visit's (actual) start, so revenue lands in the period the
  -- service was delivered even when closed out later.
  INSERT INTO sale (user_id, appointment_id, client_id, payment_type_id, amount, paid_at)
  VALUES (v_user_id, p_appointment_id, v_client_id, p_payment_type_id, p_amount, v_start_at)
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

  RETURN v_sale_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.complete_appointment(uuid, numeric, uuid, jsonb, timestamptz, integer)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.complete_appointment(uuid, numeric, uuid, jsonb, timestamptz, integer)
  TO authenticated;
