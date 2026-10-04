-- One-time phone confirmation for online booking.
--
-- A client confirms their phone by SMS once, on their first booking. Later
-- bookings with a confirmed phone skip the OTP step. Phones are stored in
-- E.164 ('+996555123456'), the format the master dashboard uses for client.phone.

CREATE TABLE IF NOT EXISTS public.phone_verification (
  phone       text PRIMARY KEY CHECK (phone ~ '^\+[1-9][0-9]{6,14}$'),
  verified_at timestamptz NOT NULL DEFAULT now()
);

-- Server-only table (service role); no policies on purpose.
ALTER TABLE public.phone_verification ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.phone_verification FROM anon, authenticated;

-- Backfill: phones that already passed an SMS check. Before this migration the
-- booking API stored bare international digits ('996555123456').
INSERT INTO public.phone_verification (phone, verified_at)
SELECT '+' || phone, max(created_at)
FROM public.otp_codes
WHERE used AND phone ~ '^[1-9][0-9]{9,14}$'
GROUP BY phone
ON CONFLICT (phone) DO NOTHING;

-- Bring online-booking clients stored as bare digits to E.164. National-format
-- numbers ('0500…') are ambiguous without a country and are left untouched.
UPDATE public.client AS c
SET phone = '+' || c.phone
WHERE c.source = 'online_booking'
  AND c.phone ~ '^[1-9][0-9]{9,14}$'
  AND NOT EXISTS (
    SELECT 1 FROM public.client AS d
    WHERE d.user_id = c.user_id AND d.phone = '+' || c.phone
  );
