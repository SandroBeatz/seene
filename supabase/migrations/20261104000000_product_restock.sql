-- A purchase is its own action now: "Пополнить" says how much came and what it cost. Changing the
-- stock in the product's form only corrects the count, in either direction, and never adds an
-- expense: a recount must not look like spending.

-- What a purchase really cost. Null on a correction, a visit, or a purchase with no price given.
ALTER TABLE public.stock_movement
  ADD COLUMN amount numeric(12,2) CONSTRAINT stock_movement_amount CHECK (amount >= 0);

-- Purchases so far were priced by the expense they wrote.
UPDATE public.stock_movement m
   SET amount = e.amount
  FROM public.expense e
 WHERE m.expense_id = e.id AND m.reason = 'restock';

DROP FUNCTION public.save_product(text, text, text, numeric, numeric, boolean, jsonb, date, uuid, numeric, numeric, numeric, text);

-- Same as 20261103290000_product_content_unit, without the expense.
CREATE FUNCTION public.save_product(
  p_name         text,
  p_type         text,
  p_unit         text,
  p_stock_delta  numeric,
  p_low_stock    numeric,
  p_services     jsonb,
  p_id           uuid    DEFAULT NULL,
  p_buy_price    numeric DEFAULT NULL,
  p_sell_price   numeric DEFAULT NULL,
  p_pack_size    numeric DEFAULT 1,
  p_content_unit text    DEFAULT NULL
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id     uuid := auth.uid();
  v_id          uuid := p_id;
  v_before      numeric := 0;
  v_after       numeric;
  v_delta       numeric;
  v_old_content text;
  v_old_pack    numeric;
  v_factor      numeric := 1;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF v_id IS NULL THEN
    v_after := GREATEST(p_stock_delta, 0);
    INSERT INTO product (
      user_id, name, type, unit, stock, low_stock, buy_price, sell_price, pack_size, content_unit
    )
    VALUES (
      v_user_id, btrim(p_name), p_type, p_unit, v_after, p_low_stock,
      p_buy_price, p_sell_price, p_pack_size, p_content_unit
    )
    RETURNING id INTO v_id;
  ELSE
    SELECT stock, content_unit, pack_size INTO v_before, v_old_content, v_old_pack
      FROM product
     WHERE id = v_id AND user_id = v_user_id
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found';
    END IF;

    IF v_old_content IS NULL AND p_content_unit IS NOT NULL THEN
      v_factor := p_pack_size;
    ELSIF v_old_content IS NOT NULL AND p_content_unit IS NULL THEN
      v_factor := 1 / v_old_pack;
    END IF;

    IF v_factor <> 1 THEN
      v_before := round(v_before * v_factor, 2);
      UPDATE stock_movement SET delta = round(delta * v_factor, 2) WHERE product_id = v_id;
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
           pack_size = p_pack_size,
           content_unit = p_content_unit,
           updated_at = now()
     WHERE id = v_id;
  END IF;

  v_delta := v_after - v_before;

  IF v_delta <> 0 THEN
    INSERT INTO stock_movement (user_id, product_id, delta, reason)
    VALUES (v_user_id, v_id, v_delta, 'correction');
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

REVOKE ALL ON FUNCTION public.save_product(text, text, text, numeric, numeric, jsonb, uuid, numeric, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_product(text, text, text, numeric, numeric, jsonb, uuid, numeric, numeric, numeric, text) TO authenticated;

-- A purchase. `p_quantity` is stored units, as the stock is. The switch is remembered on the
-- product, and a first known price becomes its buying price for the next time.
CREATE FUNCTION public.restock_product(
  p_id         uuid,
  p_quantity   numeric,
  p_to_expense boolean,
  p_today      date,
  p_total      numeric DEFAULT NULL
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id    uuid := auth.uid();
  v_name       text;
  v_pack       numeric;
  v_expense_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 OR p_total < 0 THEN
    RAISE EXCEPTION 'invalid_restock';
  END IF;

  SELECT name, pack_size INTO v_name, v_pack
    FROM product
   WHERE id = p_id AND user_id = v_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found';
  END IF;

  IF p_to_expense AND p_total > 0 THEN
    INSERT INTO expense (user_id, amount, category, note, spent_on)
    VALUES (v_user_id, p_total, 'materials', v_name, p_today)
    RETURNING id INTO v_expense_id;
  END IF;

  UPDATE product
     SET stock = stock + p_quantity,
         expense_on_restock = p_to_expense,
         buy_price = COALESCE(buy_price, round(p_total * v_pack / p_quantity, 2)),
         updated_at = now()
   WHERE id = p_id;

  INSERT INTO stock_movement (user_id, product_id, delta, reason, amount, expense_id)
  VALUES (v_user_id, p_id, p_quantity, 'restock', p_total, v_expense_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.restock_product(uuid, numeric, boolean, date, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restock_product(uuid, numeric, boolean, date, numeric) TO authenticated;
