-- client: клиентская база мастера
CREATE TABLE client (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone      TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name  TEXT,
  email      TEXT,
  birthday   DATE,
  notes      TEXT,
  source     TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_user_phone_unique UNIQUE (user_id, phone)
);

CREATE INDEX client_user_id_idx ON client(user_id);

-- updated_at auto-update (reuse existing function from service migration)
CREATE TRIGGER client_updated_at
  BEFORE UPDATE ON client
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE client ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master manages own clients"
  ON client FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RPC для букинга: найти имя клиента по телефону мастера
CREATE OR REPLACE FUNCTION find_client_name_by_phone(master_user_id uuid, phone text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT first_name FROM client
  WHERE user_id = master_user_id AND client.phone = find_client_name_by_phone.phone
  LIMIT 1;
$$;
