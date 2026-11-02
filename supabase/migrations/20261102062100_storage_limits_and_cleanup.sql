-- Both buckets are public, so without limits a signed-in user could host any file
-- of any size in their own folder. Largest file on staging today: under 500 KB.
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5 MiB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
WHERE id = 'avatars';

UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10 MiB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
WHERE id = 'master-media';

-- Daily purge of data that no longer does anything.
--   otp_codes: rate limits look back one hour; one day leaves room. Codes are plaintext.
--   client_device_token, slot_hold: expired rows are already ignored.
--   booking_link: kept 30 days past expiry so an old link still opens the expired
--   state instead of "not found".
-- cron.schedule upserts by job name, so re-running is safe.
SELECT cron.schedule(
  'purge-expired-booking-data',
  '30 3 * * *',
  $job$
    DELETE FROM public.otp_codes WHERE created_at < now() - interval '1 day';
    DELETE FROM public.client_device_token WHERE expires_at < now();
    DELETE FROM public.slot_hold WHERE expires_at < now();
    DELETE FROM public.booking_link WHERE expires_at < now() - interval '30 days';
  $job$
);
