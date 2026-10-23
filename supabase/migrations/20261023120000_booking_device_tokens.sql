-- Phase 0 of the master page plan: booking without a code only from a trusted
-- device, and rate limits for one-time codes.
--
-- Before this, a phone confirmed once on any device skipped the code forever
-- (phone_verification). Now the skip is a per-device token: issued after a
-- correct code, bound to one phone and one master, valid for 180 days. Only
-- the SHA-256 hash of the token is stored, so a leaked row cannot be replayed.

CREATE TABLE IF NOT EXISTS public.client_device_token (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash     text NOT NULL UNIQUE,
  phone          text NOT NULL CHECK (phone ~ '^[1-9][0-9]{6,14}$'),
  master_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  revoked_at     timestamptz
);

CREATE INDEX IF NOT EXISTS client_device_token_master_phone_idx
  ON public.client_device_token (master_user_id, phone);

-- Server-only table (service role); no policies on purpose.
ALTER TABLE public.client_device_token ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_device_token FROM anon, authenticated;
COMMENT ON TABLE public.client_device_token IS
  'RLS enabled, intentionally no policies -- accessed only via service_role from seene server routes.';

-- Rate limits: at most 3 codes per phone and 10 per IP an hour. The IP is kept
-- only as an HMAC, never in clear.
ALTER TABLE public.otp_codes
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS ip_hash text;

CREATE INDEX IF NOT EXISTS otp_codes_phone_created_at_idx
  ON public.otp_codes (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS otp_codes_ip_hash_created_at_idx
  ON public.otp_codes (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

-- phone_verification no longer grants a code-free booking and the web stops
-- writing to it. Its CHECK still required a leading '+', while phones are now
-- canonical digits; align it so any remaining writer does not fail.
ALTER TABLE public.phone_verification
  DROP CONSTRAINT IF EXISTS phone_verification_phone_check;
DELETE FROM public.phone_verification AS p
WHERE p.phone LIKE '+%'
  AND EXISTS (
    SELECT 1 FROM public.phone_verification AS d WHERE d.phone = substr(p.phone, 2)
  );
UPDATE public.phone_verification SET phone = substr(phone, 2) WHERE phone LIKE '+%';
ALTER TABLE public.phone_verification
  ADD CONSTRAINT phone_verification_phone_check CHECK (phone ~ '^[1-9][0-9]{6,14}$');
