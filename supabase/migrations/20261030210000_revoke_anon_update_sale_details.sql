-- `update_sale_details` was meant for signed-in masters only, but REVOKE ... FROM
-- PUBLIC does not take back the EXECUTE that Supabase grants `anon` directly, so
-- the RPC stayed callable without a session (advisor 0028). The body already
-- matches the sale on auth.uid(), so a guest only ever got `sale_not_found`.
REVOKE EXECUTE ON FUNCTION public.update_sale_details(uuid, numeric, jsonb) FROM anon;
