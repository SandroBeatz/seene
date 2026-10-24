-- The founders form (design of 24 October): the visitor's country comes from
-- the CDN's IP country and can be changed. Kyrgyzstan and Canada pick a city
-- from their own list; any other country types "country and city" as text.

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS country text,
  -- "Almaty, Kazakhstan" as typed, only for other countries
  ADD COLUMN IF NOT EXISTS place text,
  -- Two-letter country from the CDN header when she applied, for statistics
  ADD COLUMN IF NOT EXISTS ip_country text;

UPDATE public.waitlist
SET country = CASE city
    WHEN 'bishkek' THEN 'kg'
    WHEN 'toronto' THEN 'ca'
    WHEN 'vancouver' THEN 'ca'
    ELSE 'other'
  END
WHERE country IS NULL;

UPDATE public.waitlist
SET place = 'not given', city = NULL
WHERE country = 'other' AND place IS NULL;

ALTER TABLE public.waitlist DROP CONSTRAINT IF EXISTS waitlist_city_check;

ALTER TABLE public.waitlist
  ALTER COLUMN country SET NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ADD CONSTRAINT waitlist_country_check CHECK (country IN ('kg', 'ca', 'other')),
  ADD CONSTRAINT waitlist_city_by_country CHECK (
    (country = 'kg' AND place IS NULL AND city IN
      ('bishkek', 'osh', 'jalal-abad', 'karakol', 'tokmok', 'kara-balta', 'other'))
    OR (country = 'ca' AND place IS NULL AND city IN
      ('toronto', 'vancouver', 'montreal', 'calgary', 'ottawa', 'edmonton', 'mississauga', 'other'))
    OR (country = 'other' AND city IS NULL
      AND char_length(btrim(place)) BETWEEN 2 AND 100)
  ),
  ADD CONSTRAINT waitlist_ip_country_format CHECK (ip_country ~ '^[A-Z]{2}$');
