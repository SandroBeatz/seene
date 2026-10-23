-- Restrict get_analytics to authenticated users only.
-- SECURITY DEFINER functions default to PUBLIC execute; lock it down.
REVOKE ALL ON FUNCTION public.get_analytics(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_analytics(timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_analytics(timestamptz, timestamptz) TO authenticated;
