-- One-time codes: keep a hash, not the code, and check a code in one locked step.
--
-- 1. otp_codes.code held the 4 digits in plain text: anyone who could read the
--    table could book as any client with a live code. Now the web stores
--    code_hash = HMAC-SHA256(server secret, '<phone>:<code>'). A plain hash of
--    4 digits is reversed in milliseconds; without the secret it is not.
-- 2. The web read `attempts`, then wrote `attempts + 1`. Parallel requests read
--    the same value, so the limit of 5 tries could be beaten many times over.
--    verify_otp_code() locks the code row, compares and counts in one call.

-- Live codes can't be rehashed here (the secret lives on the server) and expire
-- in 5 minutes anyway. Used and expired rows stay: send rate limits count them.
DELETE FROM public.otp_codes WHERE NOT used AND expires_at > now();

ALTER TABLE public.otp_codes ADD COLUMN code_hash text;
UPDATE public.otp_codes SET code_hash = '' WHERE code_hash IS NULL;
ALTER TABLE public.otp_codes ALTER COLUMN code_hash SET NOT NULL;
ALTER TABLE public.otp_codes DROP COLUMN code;

-- Result: 'ok' (the code is now used), 'invalid_code', 'too_many_attempts' or
-- 'expired_code' (no live code for this phone).
CREATE OR REPLACE FUNCTION public.verify_otp_code(
  p_phone text,
  p_code_hash text,
  p_max_attempts integer
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
DECLARE
  v_id       uuid;
  v_hash     text;
  v_attempts integer;
BEGIN
  SELECT id, code_hash, attempts
    INTO v_id, v_hash, v_attempts
    FROM public.otp_codes
   WHERE phone = p_phone
     AND NOT used
     AND expires_at > now()
   ORDER BY created_at DESC
   LIMIT 1
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'expired_code';
  END IF;

  IF v_attempts >= p_max_attempts THEN
    RETURN 'too_many_attempts';
  END IF;

  IF v_hash = p_code_hash THEN
    UPDATE public.otp_codes SET used = true, attempts = attempts + 1 WHERE id = v_id;
    RETURN 'ok';
  END IF;

  UPDATE public.otp_codes SET attempts = attempts + 1 WHERE id = v_id;
  RETURN CASE WHEN v_attempts + 1 >= p_max_attempts THEN 'too_many_attempts' ELSE 'invalid_code' END;
END;
$function$;

REVOKE ALL ON FUNCTION public.verify_otp_code(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp_code(text, text, integer) TO service_role;
