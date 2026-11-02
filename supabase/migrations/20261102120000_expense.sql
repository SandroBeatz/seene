-- Master's expenses: the "Расходы" menu page and the money blocks of "Аналитика".
--
-- Repeating ("Повторять каждый месяц") is a chain of real rows, not a rule expanded
-- at read time, so a month can be corrected on its own and a raised rent never
-- rewrites the months already past:
--   * the newest row of a chain has repeat_monthly = true, rolled_over = false;
--   * when its next date comes, roll_recurring_expenses() copies it to that date and
--     marks it rolled_over. Turning the switch off on the newest row ends the chain.
-- repeat_day keeps the day it started on, so 31 Jan -> 28 Feb -> 31 Mar.

CREATE TABLE public.expense (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category       TEXT          NOT NULL CHECK (category IN (
                                 'materials', 'rent', 'tools', 'ads',
                                 'education', 'transport', 'other')),
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  spent_on       DATE          NOT NULL CHECK (spent_on >= DATE '2000-01-01'),
  note           TEXT          CHECK (char_length(note) <= 200),
  repeat_monthly BOOLEAN       NOT NULL DEFAULT false,
  repeat_day     SMALLINT      CHECK (repeat_day BETWEEN 1 AND 31),
  rolled_over    BOOLEAN       NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.expense IS
  'Master expenses. A monthly expense is a chain of rows; see roll_recurring_expenses().';

CREATE INDEX expense_user_spent_idx ON public.expense (user_id, spent_on DESC);
CREATE INDEX expense_due_idx ON public.expense (spent_on)
  WHERE repeat_monthly AND NOT rolled_over;

ALTER TABLE public.expense ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master manages own expenses" ON public.expense
  FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

REVOKE ALL ON public.expense FROM anon;

CREATE TRIGGER expense_set_updated_at
  BEFORE UPDATE ON public.expense
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- The anchor day follows the date the master set; a rolled copy brings its own.
CREATE FUNCTION public.expense_set_repeat_day()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT NEW.repeat_monthly THEN
    NEW.repeat_day := NULL;
  ELSIF NEW.repeat_day IS NULL
     OR (TG_OP = 'UPDATE' AND NEW.spent_on IS DISTINCT FROM OLD.spent_on) THEN
    NEW.repeat_day := EXTRACT(DAY FROM NEW.spent_on)::SMALLINT;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER expense_repeat_day
  BEFORE INSERT OR UPDATE ON public.expense
  FOR EACH ROW EXECUTE FUNCTION public.expense_set_repeat_day();

-- Copies every due monthly expense forward until its chain reaches today in the
-- master's zone (several rows when an expense was entered back-dated). Runs from
-- cron only.
CREATE FUNCTION public.roll_recurring_expenses()
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_row     public.expense%ROWTYPE;
  v_today   DATE;
  v_month   DATE;
  v_next    DATE;
  v_new_id  UUID;
  v_created INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT * FROM public.expense
     WHERE repeat_monthly AND NOT rolled_over
       AND spent_on < (now() AT TIME ZONE 'UTC')::date + 1
  LOOP
    LOOP
      BEGIN
        SELECT (now() AT TIME ZONE COALESCE(mp.schedule->>'timezone', 'UTC'))::date
          INTO v_today
          FROM public.master_profile mp
         WHERE mp.user_id = v_row.user_id;
      EXCEPTION WHEN invalid_parameter_value THEN
        v_today := NULL;  -- A zone Postgres doesn't know: fall back to UTC below.
      END;
      v_today := COALESCE(v_today, (now() AT TIME ZONE 'UTC')::date);

      v_month := (date_trunc('month', v_row.spent_on) + INTERVAL '1 month')::date;
      v_next  := LEAST(
        v_month + (COALESCE(v_row.repeat_day, EXTRACT(DAY FROM v_row.spent_on)::INT) - 1),
        (v_month + INTERVAL '1 month - 1 day')::date
      );
      EXIT WHEN v_next > v_today;

      INSERT INTO public.expense
        (user_id, category, amount, spent_on, note, repeat_monthly, repeat_day)
      VALUES
        (v_row.user_id, v_row.category, v_row.amount, v_next, v_row.note, true, v_row.repeat_day)
      RETURNING id INTO v_new_id;

      UPDATE public.expense SET rolled_over = true WHERE id = v_row.id;
      v_created := v_created + 1;

      SELECT * INTO v_row FROM public.expense WHERE id = v_new_id;
    END LOOP;
  END LOOP;
  RETURN v_created;
END;
$function$;

REVOKE ALL ON FUNCTION public.roll_recurring_expenses() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.roll_recurring_expenses() FROM anon, authenticated;

-- Hourly: masters' midnights fall on different hours. cron.schedule upserts by name.
SELECT cron.schedule(
  'roll-recurring-expenses',
  '5 * * * *',
  $job$ SELECT public.roll_recurring_expenses(); $job$
);
