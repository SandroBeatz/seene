-- "Товары и материалы" (design AppProdList, AppProdNew, AppProdEdit): stock, what a service
-- uses, and restocking into expenses. Selling products to clients waits for its own design.
--
-- Writes go through save_product and complete_appointment, so the stock and its movements
-- can't part ways: the tables are read-only for the app, apart from deleting a product.

CREATE TABLE public.product (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name                text NOT NULL CONSTRAINT product_name_length CHECK (
    char_length(btrim(name)) BETWEEN 1 AND 120
  ),
  type                text NOT NULL CONSTRAINT product_type CHECK (type IN ('work', 'sale')),
  unit                text NOT NULL CONSTRAINT product_unit CHECK (
    unit IN ('pcs', 'bottle', 'pack', 'ml', 'g')
  ),
  stock               numeric(10,2) NOT NULL DEFAULT 0 CONSTRAINT product_stock CHECK (stock >= 0),
  low_stock           numeric(10,2) NOT NULL DEFAULT 0 CONSTRAINT product_low_stock CHECK (low_stock >= 0),
  buy_price           numeric(12,2) CONSTRAINT product_buy_price CHECK (buy_price >= 0),
  sell_price          numeric(12,2) CONSTRAINT product_sell_price CHECK (sell_price >= 0),
  expense_on_restock  boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_user_idx ON public.product (user_id);

-- What one visit of a service uses. The design has no amount, a bottle needs one.
CREATE TABLE public.product_service (
  product_id uuid NOT NULL REFERENCES public.product (id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.service (id) ON DELETE CASCADE,
  quantity   numeric(10,2) NOT NULL DEFAULT 1 CONSTRAINT product_service_quantity CHECK (quantity > 0),
  PRIMARY KEY (product_id, service_id)
);

CREATE INDEX product_service_service_idx ON public.product_service (service_id);

CREATE TABLE public.stock_movement (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.product (id) ON DELETE CASCADE,
  delta      numeric(10,2) NOT NULL,
  reason     text NOT NULL CONSTRAINT stock_movement_reason CHECK (
    reason IN ('visit', 'restock', 'correction')
  ),
  sale_id    uuid REFERENCES public.sale (id) ON DELETE CASCADE,
  expense_id uuid REFERENCES public.expense (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stock_movement_user_idx ON public.stock_movement (user_id);
CREATE INDEX stock_movement_product_idx ON public.stock_movement (product_id);
CREATE INDEX stock_movement_sale_idx ON public.stock_movement (sale_id);
CREATE INDEX stock_movement_expense_idx ON public.stock_movement (expense_id);

ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own products" ON public.product
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own products" ON public.product
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can read own product services" ON public.product_service
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.product p
    WHERE p.id = product_id AND p.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can read own stock movements" ON public.stock_movement
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- Creates or updates a product. The stock comes as a change, not a value: a visit may be
-- completed while the form is open. Going up on a product that is bought for money adds an
-- expense; the first count of a new product doesn't, it was bought before.
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
  p_sell_price         numeric DEFAULT NULL
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
      user_id, name, type, unit, stock, low_stock, buy_price, sell_price, expense_on_restock
    )
    VALUES (
      v_user_id, btrim(p_name), p_type, p_unit, v_after, p_low_stock,
      p_buy_price, p_sell_price, p_expense_on_restock
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
           updated_at = now()
     WHERE id = v_id;
  END IF;

  v_delta := v_after - v_before;

  IF v_delta <> 0 THEN
    -- Rounds to nothing on a tiny amount at a low price: no expense then, the save still stands.
    v_amount := round(GREATEST(v_delta, 0) * COALESCE(p_buy_price, 0), 2);
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

REVOKE ALL ON FUNCTION public.save_product(text, text, text, numeric, numeric, boolean, jsonb, date, uuid, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_product(text, text, text, numeric, numeric, boolean, jsonb, date, uuid, numeric, numeric) TO authenticated;

-- Same as 20261102120100_sale_tip, plus what the visit used comes off the stock. It stops at
-- zero: the count is the master's estimate, and a visit must not fail over it. The movement
-- keeps what really came off, so deleting the visit returns exactly that.
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
     SET status     = 'completed',
         start_at   = v_start_at,
         duration   = COALESCE(p_duration, duration),
         updated_at = now()
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

-- A sale goes when its visit is deleted: what the visit used comes back. Its movements then go
-- with the sale.
CREATE FUNCTION public.return_stock_of_sale()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE product p
     SET stock = p.stock - m.delta,
         updated_at = now()
    FROM stock_movement m
   WHERE m.sale_id = OLD.id
     AND m.product_id = p.id;
  RETURN OLD;
END;
$function$;

REVOKE ALL ON FUNCTION public.return_stock_of_sale() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER sale_return_stock
  BEFORE DELETE ON public.sale
  FOR EACH ROW EXECUTE FUNCTION public.return_stock_of_sale();
