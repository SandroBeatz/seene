-- Attribute a sale to the day the service actually happened, not the day it was
-- checked out. Previously complete_appointment let sale.paid_at default to
-- now(), so closing out a past appointment booked revenue on today's date —
-- inconsistent with get_analytics, which already counts completed appointments
-- and working minutes by appointments.start_at.

CREATE OR REPLACE FUNCTION public.complete_appointment(
  p_appointment_id uuid,
  p_amount numeric,
  p_payment_type_id uuid,
  p_items jsonb
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
  v_start_at  TIMESTAMPTZ;
  v_item      JSONB;
BEGIN
  SELECT user_id, client_id, start_at
    INTO v_user_id, v_client_id, v_start_at
    FROM appointments
   WHERE id = p_appointment_id
     AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'appointment_not_found';
  END IF;

  IF EXISTS (SELECT 1 FROM sale WHERE appointment_id = p_appointment_id) THEN
    RAISE EXCEPTION 'already_completed';
  END IF;

  UPDATE appointments
     SET status = 'completed', updated_at = now()
   WHERE id = p_appointment_id;

  -- paid_at = the appointment's start, so revenue lands in the period the
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

-- Backfill: align existing sales to their appointment's service date so past
-- analytics is correct too.
UPDATE sale s
   SET paid_at = a.start_at
  FROM appointments a
 WHERE a.id = s.appointment_id
   AND s.paid_at <> a.start_at;
