-- One rule for client phones: canonical E.164 digits, no '+', no spaces
-- ('996212222134'), like everywhere else. Rows written by the old dashboard
-- hold '+996 212 222 134' or '+996500000855'; bring them to the rule and
-- enforce it, so every reader matches with a plain `phone = …`.
--
-- Replaces the generated `phone_digits` column from
-- 20261023220000_client_phone_digits.sql.

-- 0. Kyrgyz numbers typed in the national format ('0700000877') get the
--    country code ('996700000877'). The only non-international rows are KG.
UPDATE public.client AS c
SET phone = '996' || substr(regexp_replace(c.phone, '[^0-9]', '', 'g'), 2)
FROM public.master_profile AS m
WHERE m.user_id = c.user_id
  AND m.country = 'KG'
  AND regexp_replace(c.phone, '[^0-9]', '', 'g') ~ '^0[0-9]{9}$';

-- 1. The same number written two ways is one client: keep the oldest row,
--    move appointments and sales to it, drop the rest.
WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY user_id, regexp_replace(phone, '[^0-9]', '', 'g')
      ORDER BY created_at, id
    ) AS keep_id
  FROM public.client
),
dupes AS (
  SELECT id, keep_id FROM ranked WHERE id <> keep_id
),
moved_appointments AS (
  UPDATE public.appointments AS a
  SET client_id = d.keep_id
  FROM dupes AS d
  WHERE a.client_id = d.id
  RETURNING a.id
),
moved_sales AS (
  UPDATE public.sale AS s
  SET client_id = d.keep_id
  FROM dupes AS d
  WHERE s.client_id = d.id
  RETURNING s.id
)
SELECT
  (SELECT count(*) FROM moved_appointments) AS appointments_moved,
  (SELECT count(*) FROM moved_sales) AS sales_moved;

DELETE FROM public.client AS c
USING public.client AS k
WHERE k.user_id = c.user_id
  AND regexp_replace(k.phone, '[^0-9]', '', 'g') = regexp_replace(c.phone, '[^0-9]', '', 'g')
  AND (k.created_at, k.id) < (c.created_at, c.id);

-- 2. Digits only.
UPDATE public.client
SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone !~ '^[1-9][0-9]{6,14}$';

-- 3. The rule.
ALTER TABLE public.client
  DROP CONSTRAINT IF EXISTS client_phone_canonical;
ALTER TABLE public.client
  ADD CONSTRAINT client_phone_canonical CHECK (phone ~ '^[1-9][0-9]{6,14}$');

COMMENT ON COLUMN public.client.phone IS
  'Canonical E.164 digits, no + or spaces (996555123456). Format only for display.';

-- 4. No longer needed.
DROP INDEX IF EXISTS public.client_user_phone_digits_idx;
ALTER TABLE public.client DROP COLUMN IF EXISTS phone_digits;
