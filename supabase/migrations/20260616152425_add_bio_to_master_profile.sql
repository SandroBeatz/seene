-- Add a free-text bio shown on the master's public booking page.
-- Surfaced in the Profile settings form (Settings → Profile).
alter table public.master_profile
  add column if not exists bio text;
