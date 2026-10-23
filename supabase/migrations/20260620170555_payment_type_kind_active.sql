-- Payment methods redesign: add `kind` and `is_active` to payment_type.
--
-- `kind` distinguishes system methods (cash/card, undeletable, toggle-only)
-- from custom methods. `is_active` powers the enable/disable toggle.
-- Display name and subtitle of system methods come from i18n, not from the
-- stored `name`, so converting existing cash rows keeps their old name harmless.

-- 1. New columns (idempotent).
ALTER TABLE payment_type
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Restrict kind to the known set.
ALTER TABLE payment_type DROP CONSTRAINT IF EXISTS payment_type_kind_check;
ALTER TABLE payment_type
  ADD CONSTRAINT payment_type_kind_check CHECK (kind IN ('cash', 'card', 'custom'));

-- 3. Backfill cash from the legacy default flag.
--    Until now is_default was only ever set on the auto-seeded cash method,
--    so is_default = true reliably means "this is the cash method".
UPDATE payment_type SET kind = 'cash', is_default = true WHERE is_default = true;

-- 4. Backfill cash by name for users whose cash method was never flagged default
--    (real production data: a "Наличка" row with is_default = false). Pick a
--    single deterministic row per user that still lacks a cash method.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY user_id ORDER BY sort_order, created_at) AS rn
  FROM payment_type pt
  WHERE lower(btrim(name)) IN ('наличка', 'наличные', 'нал', 'cash')
    AND NOT EXISTS (
      SELECT 1 FROM payment_type c WHERE c.user_id = pt.user_id AND c.kind = 'cash'
    )
)
UPDATE payment_type p
SET kind = 'cash', is_default = true
FROM ranked r
WHERE p.id = r.id AND r.rn = 1;

-- 5. Ensure every existing user has a system cash method.
INSERT INTO payment_type (user_id, name, color, kind, is_default, is_active, sort_order)
SELECT pt.user_id, 'Cash', '#94a3b8', 'cash', true, true, COALESCE(MAX(pt.sort_order), -1) + 1
FROM payment_type pt
WHERE NOT EXISTS (
  SELECT 1 FROM payment_type c WHERE c.user_id = pt.user_id AND c.kind = 'cash'
)
GROUP BY pt.user_id;

-- 6. Ensure every existing user has a system card method.
INSERT INTO payment_type (user_id, name, color, kind, is_default, is_active, sort_order)
SELECT pt.user_id, 'Card', '#94a3b8', 'card', false, true, COALESCE(MAX(pt.sort_order), -1) + 1
FROM payment_type pt
WHERE NOT EXISTS (
  SELECT 1 FROM payment_type c WHERE c.user_id = pt.user_id AND c.kind = 'card'
)
GROUP BY pt.user_id;
