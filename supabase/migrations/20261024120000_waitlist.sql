-- Phase 5 of the plan: the founding masters form on the homepage.
--
-- One row per application. The site writes it through its server route with the
-- service role; nobody reads it from a browser. A repeated application with the
-- same contact keeps the first row.

CREATE TABLE IF NOT EXISTS public.waitlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  -- Instagram handle or WhatsApp number, as she typed it
  contact     text NOT NULL CHECK (char_length(btrim(contact)) BETWEEN 2 AND 100),
  city        text NOT NULL CHECK (city IN ('bishkek', 'toronto', 'vancouver', 'other')),
  specialties text[] NOT NULL CHECK (
    cardinality(specialties) BETWEEN 1 AND 5
    AND specialties <@ ARRAY['manicure', 'pedicure', 'brows', 'lashes', 'other']
  ),
  locale      text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'fr', 'ru')),
  -- SHA-256 of the sender's IP with the server secret, for the hourly limit
  ip_hash     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_contact_unique
  ON public.waitlist (lower(btrim(contact)));

CREATE INDEX IF NOT EXISTS waitlist_ip_created_idx
  ON public.waitlist (ip_hash, created_at);

-- Server-only table (service role); no policies on purpose.
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.waitlist FROM anon, authenticated;
COMMENT ON TABLE public.waitlist IS
  'Founding masters applications from the homepage. RLS enabled, intentionally no policies -- written only via service_role from seene server routes.';
