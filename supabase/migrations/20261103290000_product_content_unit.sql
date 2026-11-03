-- A product is counted by the package and used by the amount: 5 bottles of 10 ml, 2 ml a visit.
-- `unit` is the package. With `content_unit` set, `pack_size` is what one holds, and `stock`,
-- `low_stock` and `product_service.quantity` are amounts in `content_unit`: bottles of 30 ml
-- would drift by rounding at every visit. Without it they count `unit`, and `pack_size` is 1.
-- `buy_price` and `sell_price` are per package.

ALTER TABLE public.product
  ADD COLUMN content_unit text CONSTRAINT product_content_unit CHECK (content_unit IN ('ml', 'g'));

-- What the previous form saved as an amount already is one.
UPDATE public.product SET content_unit = unit, unit = 'pack' WHERE unit IN ('ml', 'g');

ALTER TABLE public.product DROP CONSTRAINT product_unit;
ALTER TABLE public.product
  ADD CONSTRAINT product_unit CHECK (unit IN ('pcs', 'bottle', 'pack')),
  ADD CONSTRAINT product_pack_size_counted CHECK (content_unit IS NOT NULL OR pack_size = 1);

-- A new argument would leave the old signature callable next to the new one.
DROP FUNCTION public.save_product(text, text, text, numeric, numeric, boolean, jsonb, date, uuid, numeric, numeric, numeric);

-- Same as 20261103270000_product_pack_size, plus the content unit. Adding or removing the
-- content changes what the stored numbers mean, not what is on the shelf: they are converted,
-- with their history so a deleted visit returns the right amount, and it is no restock.
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
  p_pack_size          numeric DEFAULT 1,
  p_content_unit       text    DEFAULT NULL
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
  v_amount      numeric;
  v_expense_id  uuid;
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
      user_id, name, type, unit, stock, low_stock, buy_price, sell_price, expense_on_restock,
      pack_size, content_unit
    )
    VALUES (
      v_user_id, btrim(p_name), p_type, p_unit, v_after, p_low_stock,
      p_buy_price, p_sell_price, p_expense_on_restock, p_pack_size, p_content_unit
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
           expense_on_restock = p_expense_on_restock,
           pack_size = p_pack_size,
           content_unit = p_content_unit,
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

REVOKE ALL ON FUNCTION public.save_product(text, text, text, numeric, numeric, boolean, jsonb, date, uuid, numeric, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_product(text, text, text, numeric, numeric, boolean, jsonb, date, uuid, numeric, numeric, numeric, text) TO authenticated;
