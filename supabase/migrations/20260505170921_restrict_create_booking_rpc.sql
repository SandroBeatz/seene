revoke execute on function public.create_booking(text, uuid[], timestamptz, text, text)
  from public, anon, authenticated;
grant execute on function public.create_booking(text, uuid[], timestamptz, text, text)
  to service_role;
