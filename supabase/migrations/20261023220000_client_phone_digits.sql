-- Client phones are stored as typed in the master app: '+996 212 222 134',
-- '+996500000855' or '996700987654'. The web looks a client up by the canonical
-- digits ('996212222134'), so lookups by `phone` missed most of them: a returning
-- client was greeted as new while the booking RPC (which compares digits) still
-- counted her bookings.
--
-- phone_digits is the phone with everything but digits removed, kept by
-- Postgres, so every reader can match on it whatever the app writes.

ALTER TABLE public.client
  ADD COLUMN IF NOT EXISTS phone_digits text
    GENERATED ALWAYS AS (regexp_replace(phone, '[^0-9]', '', 'g')) STORED;

CREATE INDEX IF NOT EXISTS client_user_phone_digits_idx
  ON public.client (user_id, phone_digits);

COMMENT ON COLUMN public.client.phone_digits IS
  'Digits of `phone` (canonical E.164 without +). Generated; match clients on this, not on `phone`.';
