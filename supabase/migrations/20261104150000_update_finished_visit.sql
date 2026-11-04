-- A finished visit is edited in place (design AppEventEditSheet, AppEventServices): its time, the
-- amount, the payment method and its services change together with the sale. NULL = keep.
-- Stock is not touched: what the visit used came off when it was completed.
CREATE FUNCTION public.update_finished_visit(
  p_appointment_id  uuid,
  p_amount          numeric DEFAULT NULL,
  p_payment_type_id uuid    DEFAULT NULL,
  p_duration        integer DEFAULT NULL,
  p_service_ids     uuid[]  DEFAULT NULL,
  p_items           jsonb   DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id uuid;
  v_item    jsonb;
BEGIN
  IF p_amount IS NOT NULL AND p_amount < 0 THEN
    RAISE EXCEPTION 'sale_amount_invalid';
  END IF;

  SELECT s.id INTO v_sale_id
    FROM sale s
    JOIN appointments a ON a.id = s.appointment_id
   WHERE s.appointment_id = p_appointment_id
     AND s.user_id = auth.uid()
     AND a.status = 'completed'
     FOR UPDATE OF s;
  IF v_sale_id IS NULL THEN
    RAISE EXCEPTION 'sale_not_found';
  END IF;

  IF p_payment_type_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM payment_type WHERE id = p_payment_type_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'payment_type_not_found';
  END IF;

  UPDATE sale
     SET amount          = COALESCE(p_amount, amount),
         payment_type_id = COALESCE(p_payment_type_id, payment_type_id)
   WHERE id = v_sale_id;

  UPDATE appointments
     SET duration    = COALESCE(p_duration, duration),
         service_ids = COALESCE(p_service_ids, service_ids),
         updated_at  = now()
   WHERE id = p_appointment_id;

  IF p_items IS NOT NULL THEN
    DELETE FROM sale_item WHERE sale_id = v_sale_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO sale_item (sale_id, service_id, name_snapshot, price_snapshot)
      VALUES (
        v_sale_id,
        NULLIF(v_item->>'service_id', '')::uuid,
        v_item->>'name',
        (v_item->>'price')::numeric
      );
    END LOOP;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_finished_visit(uuid, numeric, uuid, integer, uuid[], jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_finished_visit(uuid, numeric, uuid, integer, uuid[], jsonb)
  TO authenticated;
