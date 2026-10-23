CREATE TABLE appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES client(id) ON DELETE RESTRICT,
  service_ids  UUID[] NOT NULL DEFAULT '{}',
  start_at     TIMESTAMPTZ NOT NULL,
  duration     INTEGER NOT NULL,
  price        NUMERIC(10,2),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX appointments_user_id_idx    ON appointments(user_id);
CREATE INDEX appointments_client_id_idx ON appointments(client_id);
CREATE INDEX appointments_start_at_idx  ON appointments(start_at);
CREATE INDEX appointments_status_idx    ON appointments(status);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master manages own appointments"
  ON appointments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
