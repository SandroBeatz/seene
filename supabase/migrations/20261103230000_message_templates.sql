-- "Напоминания" (design AppMenuMessages): the master's own wording of the messages sent
-- from their WhatsApp. Standard texts live in the app; a row exists only for a text the
-- master changed.

CREATE TABLE public.message_template (
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kind       text NOT NULL CONSTRAINT message_template_kind CHECK (
    kind IN ('confirmation', 'reminder', 'recall', 'review', 'cancellation', 'reschedule')
  ),
  language   text NOT NULL CONSTRAINT message_template_language CHECK (language IN ('ru', 'en', 'fr')),
  body       text NOT NULL CONSTRAINT message_template_body_length CHECK (
    char_length(btrim(body)) BETWEEN 1 AND 1000
  ),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, language)
);

ALTER TABLE public.message_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own message templates" ON public.message_template
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own message templates" ON public.message_template
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own message templates" ON public.message_template
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own message templates" ON public.message_template
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- NULL: not known, the message goes in the master's language.
ALTER TABLE public.client
  ADD COLUMN language text CONSTRAINT client_language CHECK (language IN ('ru', 'en', 'fr'));

-- 'auto': each client in their own language.
ALTER TABLE public.master_settings
  ADD COLUMN message_language text NOT NULL DEFAULT 'auto'
    CONSTRAINT master_settings_message_language CHECK (message_language IN ('auto', 'ru', 'en', 'fr'));

-- A personal link (/c/<token>) to the master's own visit. booking_link is closed to clients,
-- so the token is made here: 32 random bytes in base64url, of which only the SHA-256 hash is
-- kept, like the links the site makes. NULL when the link could no longer work.
CREATE OR REPLACE FUNCTION public.create_booking_link(p_appointment_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires timestamptz;
  v_token   text;
BEGIN
  SELECT a.start_at + interval '24 hours' INTO v_expires
  FROM appointments a
  WHERE a.id = p_appointment_id AND a.user_id = auth.uid();

  IF v_expires IS NULL OR v_expires <= now() THEN
    RETURN NULL;
  END IF;

  v_token := translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_');

  INSERT INTO booking_link (appointment_id, token_hash, expires_at)
  VALUES (p_appointment_id, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), v_expires);

  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_link(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking_link(uuid) TO authenticated;
