-- The founders form (new homepage design): "What you do" is a free text field
-- ("nails, brows, massage") instead of five fixed choices. Existing rows keep
-- their choices as a comma separated line.

ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS specialty text;

UPDATE public.waitlist
SET specialty = array_to_string(specialties, ', ')
WHERE specialty IS NULL;

ALTER TABLE public.waitlist
  ALTER COLUMN specialty SET NOT NULL,
  ADD CONSTRAINT waitlist_specialty_length
    CHECK (char_length(btrim(specialty)) BETWEEN 2 AND 100);

ALTER TABLE public.waitlist DROP COLUMN specialties;
