-- The buying price is what the package costs: "500 ml for 630". Priced per unit, raising the
-- stock of that bottle by 500 ml wrote 315 000 into expenses. 1 keeps the price per unit, which
-- is what it is for pieces, bottles and packs.

ALTER TABLE public.product
  ADD COLUMN pack_size numeric(10,2) NOT NULL DEFAULT 1
    CONSTRAINT product_pack_size CHECK (pack_size > 0);

-- A new argument would leave the old signature callable next to the new one.
DROP FUNCTION public.save_product(text, text, text, numeric, numeric, boolean, jsonb, date, uuid, numeric, numeric);

-- Same as 20261103250000_products, plus the package: the restock's expense is its share of it.
CREATE FUNCTION public.save_product(
  p_name               text,
  p_type               text,
  p_unit               text,
  p_stock_delta        numeric,
  p_low_stock          numeric,
  p_expense_on_restock boolean,
  p_services           jsonb,
  p_today              date,
  p_id                 uuid    DEFAULT NULL,
  p_buy_price          numeric DEFAULT NULL,
  p_sell_price         numeric DEFAULT NULL,
  p_pack_size          numeric DEFAULT 1
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id    uuid := auth.uid();
  v_id         uuid := p_id;
  v_before     numeric := 0;
  v_after      numeric;
  v_delta      numeric;
  v_amount     numeric;
  v_expense_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF v_id IS NULL THEN
    v_after := GREATEST(p_stock_delta, 0);
    INSERT INTO product (
      user_id, name, type, unit, stock, low_stock, buy_price, sell_price, expense_on_restock,
      pack_size
    )
    VALUES (
      v_user_id, btrim(p_name), p_type, p_unit, v_after, p_low_stock,
      p_buy_price, p_sell_price, p_expense_on_restock, p_pack_size
    )
    RETURNING id INTO v_id;
  ELSE
    SELECT stock INTO v_before
      FROM product
     WHERE id = v_id AND user_id = v_user_id
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found';
    END IF;

    v_after := GREATEST(v_before + p_stock_delta, 0);
    UPDATE product
       SET name = btrim(p_name),
           type = p_type,
           unit = p_unit,
           stock = v_after,
           low_stock = p_low_stock,
           buy_price = p_buy_price,
           sell_price = p_sell_price,
           expense_on_restock = p_expense_on_restock,
           pack_size = p_pack_size,
           updated_at = now()
     WHERE id = v_id;
  END IF;

  v_delta := v_after - v_before;

  IF v_delta <> 0 THEN
    -- Rounds to nothing on a tiny amount at a low price: no expense then, the save still stands.
    v_amount := round(GREATEST(v_delta, 0) * COALESCE(p_buy_price, 0) / p_pack_size, 2);
    IF p_id IS NOT NULL AND p_expense_on_restock AND v_amount > 0 THEN
      INSERT INTO expense (user_id, amount, category, note, spent_on)
      VALUES (v_user_id, v_amount, 'materials', btrim(p_name), p_today)
      RETURNING id INTO v_expense_id;
    END IF;

    INSERT INTO stock_movement (user_id, product_id, delta, reason, expense_id)
    VALUES (
      v_user_id, v_id, v_delta,
      CASE WHEN v_delta > 0 THEN 'restock' ELSE 'correction' END,
      v_expense_id
    );
  END IF;

  DELETE FROM product_service WHERE product_id = v_id;

  -- Only the master's own services: a foreign id is dropped by the join.
  INSERT INTO product_service (product_id, service_id, quantity)
  SELECT v_id, s.id, (link->>'quantity')::numeric
    FROM jsonb_array_elements(COALESCE(p_services, '[]')) AS link
    JOIN service s ON s.id = (link->>'service_id')::uuid AND s.user_id = v_user_id;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_product(text, text, text, numeric, numeric, boolean, jsonb, date, uuid, numeric, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_product(text, text, text, numeric, numeric, boolean, jsonb, date, uuid, numeric, numeric, numeric) TO authenticated;
