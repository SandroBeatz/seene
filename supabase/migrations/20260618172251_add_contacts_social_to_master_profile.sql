-- Add contact and social channels shown on the master's public booking page.
-- Surfaced in the Contacts & social settings form (Settings → Contacts & social).
-- phone and address fields already exist; these are the new public contact channels.
alter table public.master_profile
  add column if not exists whatsapp text,
  add column if not exists telegram text,
  add column if not exists instagram text,
  add column if not exists tiktok text,
  add column if not exists contact_email text;
