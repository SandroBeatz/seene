-- The founders form (25 October): the city is typed by hand, not picked from a
-- list. Kyrgyzstan and Canada keep `city`, another country keeps `place`
-- ("Almaty, Kazakhstan").

ALTER TABLE public.waitlist DROP CONSTRAINT IF EXISTS waitlist_city_by_country;

ALTER TABLE public.waitlist
  ADD CONSTRAINT waitlist_city_by_country CHECK (
    (country IN ('kg', 'ca') AND place IS NULL
      AND char_length(btrim(city)) BETWEEN 2 AND 100)
    OR (country = 'other' AND city IS NULL
      AND char_length(btrim(place)) BETWEEN 2 AND 100)
  );
