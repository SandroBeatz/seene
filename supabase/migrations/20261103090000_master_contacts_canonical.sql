-- The master's contacts follow the same rules as the client card (20261030220000):
-- phones are E.164 digits without "+", messengers are bare usernames. Values that
-- can't be converted are dropped: the master re-enters them in the profile, and
-- nothing else can read them reliably anyway.

UPDATE public.master_profile
SET
  phone = CASE
    WHEN regexp_replace(COALESCE(phone, ''), '\D', '', 'g') ~ '^[1-9][0-9]{6,14}$'
      THEN regexp_replace(phone, '\D', '', 'g')
  END,
  whatsapp = CASE
    WHEN regexp_replace(COALESCE(whatsapp, ''), '\D', '', 'g') ~ '^[1-9][0-9]{6,14}$'
      THEN regexp_replace(whatsapp, '\D', '', 'g')
  END,
  telegram = NULLIF(substring(
    regexp_replace(
      regexp_replace(COALESCE(telegram, ''), '^\s*(https?://)?(www\.)?(t|telegram)\.me/', '', 'i'),
      '^@|[/?#].*$|\s+$', '', 'g'
    ) FROM '^[A-Za-z0-9_]{5,32}$'
  ), ''),
  instagram = NULLIF(substring(
    lower(regexp_replace(
      regexp_replace(COALESCE(instagram, ''), '^\s*(https?://)?(www\.)?instagram\.com/', '', 'i'),
      '^@|[/?#].*$|\s+$', '', 'g'
    )) FROM '^[a-z0-9._]{1,30}$'
  ), '');

ALTER TABLE public.master_profile
  ADD CONSTRAINT master_profile_phone_canonical CHECK (phone ~ '^[1-9][0-9]{6,14}$'),
  ADD CONSTRAINT master_profile_whatsapp_canonical CHECK (whatsapp ~ '^[1-9][0-9]{6,14}$'),
  ADD CONSTRAINT master_profile_telegram_username CHECK (telegram ~ '^[A-Za-z0-9_]{5,32}$'),
  ADD CONSTRAINT master_profile_instagram_username CHECK (instagram ~ '^[A-Za-z0-9._]{1,30}$');
