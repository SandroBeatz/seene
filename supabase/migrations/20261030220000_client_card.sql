-- The client card of the mobile app (design "Клиенты": новый / редактировать /
-- профиль). Only the name is required; the card gets an avatar colour, messengers
-- and a birthday without a year. Drops what the card no longer has.

-- Phone becomes optional: a master may add "Айгерим" before knowing her number.
-- Still unique per master when set, still canonical E.164 digits.
ALTER TABLE public.client ALTER COLUMN phone DROP NOT NULL;

-- One of the nine avatar backgrounds; NULL = derived from the name in the app.
ALTER TABLE public.client
  ADD COLUMN avatar_color TEXT
    CONSTRAINT client_avatar_color_valid CHECK (avatar_color IN (
      'rose', 'lavender', 'peach', 'mint', 'sky', 'honey', 'plum', 'sea', 'graphite'
    ));

-- Messengers. WhatsApp is a phone (canonical digits, like `phone`); Telegram and
-- Instagram are usernames without "@".
ALTER TABLE public.client
  ADD COLUMN whatsapp TEXT
    CONSTRAINT client_whatsapp_canonical CHECK (whatsapp ~ '^[1-9][0-9]{6,14}$'),
  ADD COLUMN telegram TEXT
    CONSTRAINT client_telegram_username CHECK (telegram ~ '^[A-Za-z0-9_]{5,32}$'),
  ADD COLUMN instagram TEXT
    CONSTRAINT client_instagram_username CHECK (instagram ~ '^[A-Za-z0-9._]{1,30}$');

-- Birthday as day + month: the master greets on the day, the year is not asked.
ALTER TABLE public.client
  ADD COLUMN birth_day SMALLINT,
  ADD COLUMN birth_month SMALLINT,
  ADD CONSTRAINT client_birthday_valid CHECK (
    (birth_day IS NULL) = (birth_month IS NULL)
    AND (
      birth_month IS NULL
      OR (
        birth_month BETWEEN 1 AND 12
        AND birth_day BETWEEN 1 AND CASE
          WHEN birth_month = 2 THEN 29
          WHEN birth_month IN (4, 6, 9, 11) THEN 30
          ELSE 31
        END
      )
    )
  );

UPDATE public.client
   SET birth_day = extract(day FROM birthday)::SMALLINT,
       birth_month = extract(month FROM birthday)::SMALLINT
 WHERE birthday IS NOT NULL;

-- Replaced by birth_day/birth_month and avatar_color; email is not on the card and
-- nothing reads it.
ALTER TABLE public.client
  DROP COLUMN birthday,
  DROP COLUMN emoji,
  DROP COLUMN email;

-- Per-client numbers for the list and the profile: finished visits, no-shows, the
-- first and last visit, the next booking and the money spent (the sale when the
-- visit was checked out, else the booked price). Invoker rights: RLS on client,
-- appointments and sale keeps it to the caller's own book.
CREATE FUNCTION public.client_summaries()
RETURNS TABLE (
  client_id   UUID,
  visits      INTEGER,
  no_shows    INTEGER,
  first_visit TIMESTAMPTZ,
  last_visit  TIMESTAMPTZ,
  next_visit  TIMESTAMPTZ,
  spent       NUMERIC
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    count(*) FILTER (WHERE a.status = 'completed')::INTEGER,
    count(*) FILTER (WHERE a.status = 'no_show')::INTEGER,
    min(a.start_at) FILTER (WHERE a.status = 'completed'),
    max(a.start_at) FILTER (WHERE a.status = 'completed'),
    min(a.start_at) FILTER (WHERE a.status IN ('pending', 'confirmed') AND a.start_at > now()),
    coalesce(sum(coalesce(s.amount, a.price, 0)) FILTER (WHERE a.status = 'completed'), 0)
  FROM client c
  LEFT JOIN appointments a ON a.client_id = c.id
  LEFT JOIN sale s ON s.appointment_id = a.id
  WHERE c.user_id = (SELECT auth.uid())
  GROUP BY c.id;
$$;

REVOKE EXECUTE ON FUNCTION public.client_summaries() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.client_summaries() TO authenticated;
