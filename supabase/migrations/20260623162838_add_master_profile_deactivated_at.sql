-- Soft-delete support for master accounts.
-- When a master requests account deletion we set this timestamp instead of
-- deleting data immediately. NULL = active account. The value is the start of
-- the 30-day grace window after which a scheduled job physically removes the
-- account (see master.seene-c5og).
ALTER TABLE public.master_profile
  ADD COLUMN deactivated_at timestamptz NULL;

COMMENT ON COLUMN public.master_profile.deactivated_at IS
  'When the master requested account deletion (soft-delete). NULL = active. Physical deletion happens 30 days after this date.';
