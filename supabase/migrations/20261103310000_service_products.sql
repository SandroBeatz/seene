-- The link between a product and a service can now be set from the service too. The product's
-- form keeps writing it through save_product; the table stays read-only for the app.
CREATE FUNCTION public.set_service_products(
  p_service_id uuid,
  p_products   jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service WHERE id = p_service_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'service_not_found';
  END IF;

  DELETE FROM product_service WHERE service_id = p_service_id;

  -- Only the master's own products: a foreign id is dropped by the join.
  INSERT INTO product_service (product_id, service_id, quantity)
  SELECT p.id, p_service_id, (link->>'quantity')::numeric
    FROM jsonb_array_elements(COALESCE(p_products, '[]')) AS link
    JOIN product p ON p.id = (link->>'product_id')::uuid AND p.user_id = v_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_service_products(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_service_products(uuid, jsonb) TO authenticated;
