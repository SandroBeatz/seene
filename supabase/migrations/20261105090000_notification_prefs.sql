-- What the master wants to be told (design AppNotifSettings). A key left out means its default,
-- which lives in the app (entities/master/lib/notification-prefs.ts) and, for the kinds written
-- today, here: on. Turned off, a kind doesn't reach the feed at all.
ALTER TABLE public.master_settings
  ADD COLUMN notification_prefs jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.notify_visit(p_kind text, p_visit public.appointments, p_extra jsonb)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_name     text;
  v_services text[];
  v_total    numeric;
BEGIN
  IF EXISTS (
    SELECT 1 FROM master_settings
     WHERE user_id = p_visit.user_id
       AND (notification_prefs ->> p_kind)::boolean IS FALSE
  ) THEN
    RETURN;
  END IF;

  SELECT trim(concat_ws(' ', first_name, last_name)) INTO v_name
    FROM client WHERE id = p_visit.client_id;

  SELECT array_agg(s.name ORDER BY picked.position), COALESCE(sum(s.price), 0)
    INTO v_services, v_total
    FROM unnest(p_visit.service_ids) WITH ORDINALITY AS picked(id, position)
    JOIN service s ON s.id = picked.id;

  INSERT INTO notification (user_id, kind, appointment_id, client_id, payload)
  VALUES (
    p_visit.user_id,
    p_kind,
    p_visit.id,
    p_visit.client_id,
    jsonb_build_object(
      'client_name', v_name,
      'start_at', p_visit.start_at,
      'services', COALESCE(to_jsonb(v_services), '[]'::jsonb),
      'price', COALESCE(p_visit.price, v_total)
    ) || p_extra
  );
END;
$function$;
