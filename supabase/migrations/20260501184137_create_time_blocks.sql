CREATE TABLE time_block (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  all_day    BOOLEAN NOT NULL DEFAULT false,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX time_block_user_id_idx  ON time_block(user_id);
CREATE INDEX time_block_start_at_idx ON time_block(start_at);
CREATE INDEX time_block_end_at_idx   ON time_block(end_at);

ALTER TABLE time_block ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master manages own time blocks"
  ON time_block FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER time_block_updated_at
  BEFORE UPDATE ON time_block
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
