-- Onboarding redesign (mobile v3): optional phone, 14 profession keys, a profession
-- on every service, and one atomic RPC that writes the whole onboarding.

-- 1. Phone is no longer collected at onboarding (masters add it later in settings).
ALTER TABLE public.master_profile ALTER COLUMN phone DROP NOT NULL;

-- 2. Profession keys: the 9 broad keys become 14 specific ones. The list lives in one
--    immutable function so both CHECKs (and future ones) share it.
CREATE OR REPLACE FUNCTION public.specialization_keys()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY[
    'lashes', 'brows', 'manicure', 'pedicure', 'hair', 'barbers', 'makeup',
    'skincare', 'hair_removal', 'massage', 'permanent_makeup', 'tattoo',
    'piercing', 'pet_grooming'
  ]::text[];
$$;

-- Old → new: a broad key expands to every specific key it covered.
UPDATE public.master_profile AS mp
SET specializations = mapped.keys
FROM (
  SELECT p.id, array_agg(DISTINCT k ORDER BY k) AS keys
  FROM public.master_profile AS p
  CROSS JOIN LATERAL unnest(p.specializations) AS s
  CROSS JOIN LATERAL unnest(
    CASE s
      WHEN 'nails' THEN ARRAY['manicure', 'pedicure']
      WHEN 'barber' THEN ARRAY['barbers']
      WHEN 'tattoo_piercing' THEN ARRAY['tattoo', 'piercing']
      WHEN 'depilation' THEN ARRAY['hair_removal']
      WHEN 'cosmetology' THEN ARRAY['skincare']
      WHEN 'brows_lashes' THEN ARRAY['brows', 'lashes']
      ELSE ARRAY[s]
    END
  ) AS k
  GROUP BY p.id
) AS mapped
WHERE mp.id = mapped.id;

ALTER TABLE public.master_profile
  ADD CONSTRAINT master_profile_specializations_valid
  CHECK (
    cardinality(specializations) >= 1
    AND specializations <@ public.specialization_keys()
  );

-- 3. Each service belongs to one profession ("Раздел" in the app). Nullable: services
--    created before this, or by masters with several professions, may have none.
ALTER TABLE public.service
  ADD COLUMN specialization text
  CONSTRAINT service_specialization_valid
  CHECK (specialization IS NULL OR specialization = ANY (public.specialization_keys()));

-- A master with exactly one profession: all their services are in it.
UPDATE public.service AS s
SET specialization = mp.specializations[1]
FROM public.master_profile AS mp
WHERE mp.user_id = s.user_id
  AND cardinality(mp.specializations) = 1;

-- 4. complete_onboarding: profile + settings + services (+ categories) in one
--    transaction, so a failed step never leaves a half-created master.
--
-- Payload:
--   first_name, last_name, username, specializations text[],
--   schedule { timezone, days{...} }   (the master_profile.schedule shape),
--   currency, language, time_format, theme,
--   online_booking_enabled bool, booking_default_status 'pending'|'confirmed',
--   services [{ name, duration, price?, price_from?, description?, color,
--               specialization?, category? }]
--
-- A service without a price is stored with price 0 and show_online = false: it is
-- hidden from the booking page until the master sets a price.
--
-- SECURITY INVOKER: every write goes through the caller's own RLS policies.
CREATE OR REPLACE FUNCTION public.complete_onboarding(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile_id uuid;
  v_first_name text := btrim(coalesce(p_payload->>'first_name', ''));
  v_schedule jsonb := p_payload->'schedule';
  v_service jsonb;
  v_category text;
  v_category_id uuid;
  v_category_ids jsonb := '{}'::jsonb;
  v_duration integer;
  v_price numeric;
  v_index integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM master_profile WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'already_completed';
  END IF;

  IF v_first_name = ''
    OR jsonb_typeof(v_schedule) IS DISTINCT FROM 'object'
    OR coalesce(v_schedule->>'timezone', '') = ''
  THEN
    RAISE EXCEPTION 'invalid_payload' USING ERRCODE = '22023';
  END IF;

  INSERT INTO master_profile (user_id, first_name, last_name, username, specializations, schedule)
  VALUES (
    v_uid,
    v_first_name,
    btrim(coalesce(p_payload->>'last_name', '')),
    lower(btrim(coalesce(p_payload->>'username', ''))),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(p_payload->'specializations', '[]'::jsonb))),
    v_schedule
  )
  RETURNING id INTO v_profile_id;

  INSERT INTO master_settings (
    user_id, currency, language, time_format, theme,
    online_booking_enabled, booking_default_status
  )
  VALUES (
    v_uid,
    upper(coalesce(p_payload->>'currency', 'USD')),
    coalesce(p_payload->>'language', 'en'),
    coalesce((p_payload->>'time_format')::smallint, 24),
    coalesce(p_payload->>'theme', 'auto'),
    coalesce((p_payload->>'online_booking_enabled')::boolean, true),
    coalesce(p_payload->>'booking_default_status', 'pending')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    currency = EXCLUDED.currency,
    language = EXCLUDED.language,
    time_format = EXCLUDED.time_format,
    theme = EXCLUDED.theme,
    online_booking_enabled = EXCLUDED.online_booking_enabled,
    booking_default_status = EXCLUDED.booking_default_status;

  FOR v_service IN
    SELECT value FROM jsonb_array_elements(coalesce(p_payload->'services', '[]'::jsonb))
  LOOP
    v_duration := (v_service->>'duration')::integer;
    IF coalesce(btrim(v_service->>'name'), '') = '' OR v_duration IS NULL
      OR v_duration < 5 OR v_duration > 1440
    THEN
      RAISE EXCEPTION 'invalid_payload' USING ERRCODE = '22023';
    END IF;

    -- Categories are created once per distinct name in this payload.
    v_category := nullif(btrim(coalesce(v_service->>'category', '')), '');
    v_category_id := NULL;
    IF v_category IS NOT NULL THEN
      v_category_id := (v_category_ids->>v_category)::uuid;
      IF v_category_id IS NULL THEN
        INSERT INTO service_category (user_id, name, sort_order)
        VALUES (v_uid, v_category, (SELECT count(*) FROM jsonb_object_keys(v_category_ids)))
        RETURNING id INTO v_category_id;
        v_category_ids := v_category_ids || jsonb_build_object(v_category, v_category_id);
      END IF;
    END IF;

    v_price := nullif(v_service->>'price', '')::numeric;
    INSERT INTO service (
      user_id, category_id, specialization, name, description, duration,
      price, price_from, show_online, color, sort_order
    )
    VALUES (
      v_uid,
      v_category_id,
      v_service->>'specialization',
      btrim(v_service->>'name'),
      nullif(btrim(coalesce(v_service->>'description', '')), ''),
      v_duration,
      coalesce(v_price, 0),
      coalesce((v_service->>'price_from')::boolean, false),
      v_price IS NOT NULL,
      v_service->>'color',
      v_index
    );
    v_index := v_index + 1;
  END LOOP;

  RETURN v_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_onboarding(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(jsonb) TO authenticated;
