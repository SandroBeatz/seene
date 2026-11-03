-- Deleting an account from the app: the master requests it, has 30 days to restore
-- it, then a daily web route (server/api/cron/purge-accounts) removes everything.

CREATE OR REPLACE FUNCTION public.deactivate_account()
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.master_profile
  SET deactivated_at = now()
  WHERE user_id = auth.uid() AND deactivated_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.reactivate_account()
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.master_profile
  SET deactivated_at = NULL
  WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.deactivate_account() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reactivate_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deactivate_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_account() TO authenticated;

-- Removes the rows that block deleting the auth user: appointments and sales
-- restrict deleting a client, so cascades from auth.users can fail on their order.
-- The profile stays until the auth user goes, so a failed run is picked up again.
CREATE OR REPLACE FUNCTION public.purge_account_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.master_profile
    WHERE user_id = p_user_id AND deactivated_at < now() - interval '30 days'
  ) THEN
    RAISE EXCEPTION 'account % is not due for deletion', p_user_id;
  END IF;

  DELETE FROM public.sale WHERE user_id = p_user_id;
  DELETE FROM public.appointments WHERE user_id = p_user_id;
  DELETE FROM public.client WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_account_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_account_data(uuid) TO service_role;
