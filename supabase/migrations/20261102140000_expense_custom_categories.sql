-- "+ Своя" in "Новый расход": a master's own expense categories.
--
-- expense.category keeps the fixed keys for the built-in ones and the name itself for a
-- master's own, so a row reads on its own: "Аналитика" and the monthly roll-over need no
-- change. There is no renaming; expense_category is only the list the sheet offers.

ALTER TABLE public.expense DROP CONSTRAINT expense_category_check;
ALTER TABLE public.expense
  ADD CONSTRAINT expense_category_check CHECK (char_length(btrim(category)) BETWEEN 1 AND 40);

CREATE TABLE public.expense_category (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.expense_category IS
  'A master''s own expense categories, offered in the expense sheet.';

CREATE UNIQUE INDEX expense_category_user_name_idx
  ON public.expense_category (user_id, lower(name));

ALTER TABLE public.expense_category ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master manages own expense categories" ON public.expense_category
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

REVOKE ALL ON public.expense_category FROM anon;
