-- Address redesign: remove entrance_code/floor/apartment, add country/house_number,
-- make city/address/zip_code optional.
-- Applied: 2026-04-26

-- Remove unused address fields
ALTER TABLE public.master_profile DROP COLUMN IF EXISTS entrance_code;
ALTER TABLE public.master_profile DROP COLUMN IF EXISTS floor;
ALTER TABLE public.master_profile DROP COLUMN IF EXISTS apartment;

-- Add new required field: country (ISO 3166-1 alpha-2 code or name)
ALTER TABLE public.master_profile ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT '';

-- Add new optional field: house number
ALTER TABLE public.master_profile ADD COLUMN IF NOT EXISTS house_number text;

-- Make address fields optional (only country is required now)
ALTER TABLE public.master_profile ALTER COLUMN city DROP NOT NULL;
ALTER TABLE public.master_profile ALTER COLUMN address DROP NOT NULL;
ALTER TABLE public.master_profile ALTER COLUMN zip_code DROP NOT NULL;
