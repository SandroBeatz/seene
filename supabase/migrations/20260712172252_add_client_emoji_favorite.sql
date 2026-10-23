-- Add emoji avatar and favorite flag to client.
-- emoji: optional single emoji used as the client's avatar (falls back to initials).
-- is_favorite: favorites are listed first in the clients list.
ALTER TABLE public.client
  ADD COLUMN IF NOT EXISTS emoji text,
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;
