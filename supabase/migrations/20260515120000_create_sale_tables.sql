-- sale: one financial record per completed appointment
CREATE TABLE sale (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id   UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE RESTRICT,
  client_id        UUID NOT NULL REFERENCES client(id) ON DELETE RESTRICT,
  payment_type_id  UUID REFERENCES payment_type(id) ON DELETE SET NULL,
  amount           NUMERIC(10,2) NOT NULL,
  paid_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sale_user_id_idx        ON sale(user_id);
CREATE INDEX sale_paid_at_idx        ON sale(paid_at);

ALTER TABLE sale ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master manages own sales"
  ON sale FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- sale_item: price snapshot per service within a sale
CREATE TABLE sale_item (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID NOT NULL REFERENCES sale(id) ON DELETE CASCADE,
  service_id      UUID,
  name_snapshot   TEXT NOT NULL,
  price_snapshot  NUMERIC(10,2) NOT NULL
);

CREATE INDEX sale_item_sale_id_idx ON sale_item(sale_id);

ALTER TABLE sale_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master manages own sale items"
  ON sale_item FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sale
      WHERE sale.id = sale_item.sale_id
        AND sale.user_id = auth.uid()
    )
  );

-- RPC: atomically complete an appointment and record the sale
CREATE OR REPLACE FUNCTION complete_appointment(
  p_appointment_id  UUID,
  p_amount          NUMERIC,
  p_payment_type_id UUID,
  p_items           JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id   UUID;
  v_user_id   UUID;
  v_client_id UUID;
  v_item      JSONB;
BEGIN
  SELECT user_id, client_id
    INTO v_user_id, v_client_id
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

  INSERT INTO sale (user_id, appointment_id, client_id, payment_type_id, amount)
  VALUES (v_user_id, p_appointment_id, v_client_id, p_payment_type_id, p_amount)
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
$$;
