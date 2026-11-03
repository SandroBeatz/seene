-- Portfolio screen (design AppMenuPortfolio): a caption on a photo, a switch for showing
-- the photos on the public page, and the order the master drags them into.

ALTER TABLE public.portfolio_item
  ADD COLUMN caption text,
  ADD CONSTRAINT portfolio_item_caption_length CHECK (char_length(caption) <= 60);

ALTER TABLE public.master_settings
  ADD COLUMN show_portfolio boolean NOT NULL DEFAULT true;

-- Not SECURITY DEFINER: row security keeps a master to their own photos.
CREATE OR REPLACE FUNCTION public.reorder_portfolio(p_ids uuid[])
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE portfolio_item p
  SET sort_order = o.position
  FROM unnest(p_ids) WITH ORDINALITY AS o(id, position)
  WHERE p.id = o.id;
$$;

REVOKE ALL ON FUNCTION public.reorder_portfolio(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_portfolio(uuid[]) TO authenticated;
