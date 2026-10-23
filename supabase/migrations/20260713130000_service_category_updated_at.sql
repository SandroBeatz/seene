-- Service categories are becoming user-editable (CRUD in settings + inline
-- creation from the service form). Track updated_at so renames are auditable
-- and reuse the shared update_updated_at() trigger function.
ALTER TABLE public.service_category
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS service_category_updated_at ON public.service_category;
CREATE TRIGGER service_category_updated_at
  BEFORE UPDATE ON public.service_category
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Note: service.category_id FK already has ON DELETE SET NULL, so deleting a
-- category automatically unassigns its services (they fall back to "All").
