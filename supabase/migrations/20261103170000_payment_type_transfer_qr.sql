-- "Способы оплаты": transfer and QR join cash and card as system methods.
--
-- They start switched off, so nothing changes at checkout until a master turns them on.
-- sort_order follows the design: cash, transfer, card, QR, then the master's own methods.

ALTER TABLE public.payment_type DROP CONSTRAINT payment_type_kind_check;
ALTER TABLE public.payment_type
  ADD CONSTRAINT payment_type_kind_check
  CHECK (kind IN ('cash', 'card', 'transfer', 'qr', 'custom'));

UPDATE public.payment_type SET sort_order = sort_order + 4 WHERE kind = 'custom';
UPDATE public.payment_type SET sort_order = 0 WHERE kind = 'cash';
UPDATE public.payment_type SET sort_order = 2 WHERE kind = 'card';

INSERT INTO public.payment_type (user_id, name, color, kind, is_default, is_active, sort_order)
SELECT mp.user_id, seed.name, seed.color, seed.kind, false, false, seed.sort_order
FROM public.master_profile mp
CROSS JOIN (
  VALUES
    ('Transfer', '#a78bfa', 'transfer', 1),
    ('QR', '#fbbf24', 'qr', 3)
) AS seed (name, color, kind, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_type pt
  WHERE pt.user_id = mp.user_id AND pt.kind = seed.kind
);
