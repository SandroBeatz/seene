-- Add place_id (Google Places ID) to master_profile for future geocoding/lookup
-- Applied: 2026-04-26

ALTER TABLE public.master_profile ADD COLUMN IF NOT EXISTS place_id text;
