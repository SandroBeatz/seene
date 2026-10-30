-- "Объединить дубли" on the mobile client profile: the same person twice in the
-- book (added by hand, then booked online with another spelling). The merged
-- client's visits and sales move to the kept one, the kept card takes whatever it
-- was missing, and the merged card is deleted — all in one transaction.
--
-- Invoker rights: RLS on client, appointments and sale already limits every row
-- to the caller's own book; the explicit user check gives a clear error.

CREATE FUNCTION public.merge_clients(p_keep UUID, p_merge UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_keep  client;
  v_merge client;
BEGIN
  IF p_keep = p_merge THEN
    RAISE EXCEPTION 'same_client';
  END IF;

  SELECT * INTO v_keep FROM client
   WHERE id = p_keep AND user_id = (SELECT auth.uid()) FOR UPDATE;
  SELECT * INTO v_merge FROM client
   WHERE id = p_merge AND user_id = (SELECT auth.uid()) FOR UPDATE;
  IF v_keep.id IS NULL OR v_merge.id IS NULL THEN
    RAISE EXCEPTION 'client_not_found';
  END IF;

  UPDATE appointments SET client_id = p_keep WHERE client_id = p_merge;
  UPDATE sale SET client_id = p_keep WHERE client_id = p_merge;

  -- Deleted before the kept card takes its phone: (user_id, phone) is unique.
  DELETE FROM client WHERE id = p_merge;

  UPDATE client SET
    last_name = coalesce(last_name, v_merge.last_name),
    phone = coalesce(phone, v_merge.phone),
    whatsapp = coalesce(whatsapp, v_merge.whatsapp),
    telegram = coalesce(telegram, v_merge.telegram),
    instagram = coalesce(instagram, v_merge.instagram),
    avatar_color = coalesce(avatar_color, v_merge.avatar_color),
    -- Day and month travel together (client_birthday_valid).
    birth_day = CASE WHEN birth_day IS NULL THEN v_merge.birth_day ELSE birth_day END,
    birth_month = CASE WHEN birth_day IS NULL THEN v_merge.birth_month ELSE birth_month END,
    notes = CASE
      WHEN v_merge.notes IS NULL OR v_merge.notes = notes THEN notes
      WHEN notes IS NULL THEN v_merge.notes
      ELSE notes || E'\n\n' || v_merge.notes
    END,
    is_favorite = is_favorite OR v_merge.is_favorite,
    blocked = blocked OR v_merge.blocked,
    reminders_consent = reminders_consent OR v_merge.reminders_consent,
    marketing_consent = marketing_consent OR v_merge.marketing_consent,
    created_at = least(created_at, v_merge.created_at),
    updated_at = now()
  WHERE id = p_keep;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.merge_clients(UUID, UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.merge_clients(UUID, UUID) TO authenticated;
