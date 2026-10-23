-- RPC function to check username availability without exposing master_profile rows.
-- SECURITY DEFINER bypasses RLS so any authenticated user can check if a username
-- is taken, without seeing other users' data.
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM master_profile WHERE username = p_username
  );
$$;

REVOKE ALL ON FUNCTION public.check_username_available(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_username_available(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;
