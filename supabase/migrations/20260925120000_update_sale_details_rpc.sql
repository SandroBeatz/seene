-- Keep the recorded sale total and per-service price snapshots in sync when a
-- completed appointment is edited from the payment details UI.
CREATE OR REPLACE FUNCTION update_sale_details(
  p_sale_id UUID,
  p_amount NUMERIC,
  p_items JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
BEGIN
  IF p_amount < 0 THEN
    RAISE EXCEPTION 'sale_amount_invalid';
  END IF;

  UPDATE sale
     SET amount = p_amount
   WHERE id = p_sale_id
     AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'sale_not_found';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::JSONB))
  LOOP
    IF (v_item->>'price')::NUMERIC < 0 THEN
      RAISE EXCEPTION 'sale_item_amount_invalid';
    END IF;

    UPDATE sale_item
       SET price_snapshot = (v_item->>'price')::NUMERIC
     WHERE id = (v_item->>'id')::UUID
       AND sale_id = p_sale_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'sale_item_not_found';
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION update_sale_details(UUID, NUMERIC, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_sale_details(UUID, NUMERIC, JSONB) TO authenticated;
