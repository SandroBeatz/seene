-- service_category: категории услуг мастера
CREATE TABLE service_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE service_category ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own categories" ON service_category
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- service: услуги мастера
CREATE TABLE service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_category(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- минуты: 15/30/45/60/90/120
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER service_updated_at
  BEFORE UPDATE ON service
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE service ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own services" ON service
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
