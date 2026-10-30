-- "Требуют внимания" on the mobile "Сегодня" tab: cards the master closed.
-- One row per card key (e.g. `client_cancelled:<appointment id>`,
-- `recall:<client id>`, `reminder:<appointment id>`), so a dismissal follows the
-- master across devices. `until` NULL = for good ("Понятно"); a time = snoozed
-- until then ("Позже"). Writing the same key again moves `until`.

CREATE TABLE public.attention_dismissal (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT        NOT NULL CHECK (char_length(key) BETWEEN 1 AND 120),
  until      TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

COMMENT ON TABLE public.attention_dismissal IS
  'Closed or snoozed "Требуют внимания" cards of the mobile app; until NULL = for good.';

ALTER TABLE public.attention_dismissal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master manages own dismissals" ON public.attention_dismissal
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

REVOKE ALL ON public.attention_dismissal FROM anon;
