-- Unused: nothing in the web or mobile code reads these tables, and no function
-- does either. phone_verification still held client phone numbers.
DROP TABLE public.availability;
DROP TABLE public.phone_verification;

-- Each is a prefix of a wider index on the same table.
DROP INDEX public.client_user_id_idx;       -- client_user_phone_unique
DROP INDEX public.appointments_user_id_idx; -- appointments_user_status_start_idx
DROP INDEX public.otp_codes_phone_idx;      -- otp_codes_phone_created_at_idx
DROP INDEX public.sale_user_id_idx;         -- sale_user_paid_at_idx

-- Foreign key with no index; most appointments have no value here.
CREATE INDEX appointments_rescheduled_from_idx
  ON public.appointments (rescheduled_from)
  WHERE rescheduled_from IS NOT NULL;

-- updated_at never changed on this table.
CREATE TRIGGER master_settings_updated_at
  BEFORE UPDATE ON public.master_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
