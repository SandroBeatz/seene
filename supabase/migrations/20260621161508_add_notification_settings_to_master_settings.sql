-- Add notification settings to the master's operational config.
-- Surfaced in the Notifications settings form (Settings → Notifications).
--
-- Client reminders (sent to the client about their own appointment):
--   client_reminder_whatsapp_enabled = send appointment reminders via WhatsApp
--   client_reminder_offsets_minutes  = shared "when to remind" offsets, in minutes
--                                      before the appointment. UI values: 1440 (24h),
--                                      120 (2h), 60 (1h). Default {1440,120}.
--   (Telegram is intentionally NOT added here — it ships with the Telegram
--    mini-app integration in its own future migration.)
--
-- Master alerts (in-app/web heads-up for the master — delivery infra is future):
--   alert_new_booking_enabled          = a client booked an appointment
--   alert_awaiting_confirmation_enabled = a request needs the master's approval
--   alert_cancellation_enabled         = a client cancelled a booking
--   alert_upcoming_appointment_enabled = remind the master before each upcoming appointment
--   alert_upcoming_offset_minutes      = how long before the appointment to alert
--
-- DESIGN NOTE — why flat columns:
--   These are all strictly 1:1 with the master (master_settings has a unique
--   user_id), so they live as flat columns here, consistent with the booking
--   settings added in 20260620120000. This is deliberate, not laziness.
--   INFLECTION POINT — when to normalize: once real delivery infra arrives with
--   genuine many-to-one cardinality (multiple channels / templates / custom
--   reminder rules per master), do NOT keep widening this flat set — introduce
--   normalized child tables instead, e.g.:
--     reminder_rules(master_id, event, channel, offset_minutes, enabled, ...)
--     notification_channels(master_id, channel, enabled, credentials, ...)
--
-- Defaults keep client WhatsApp reminders OFF and the "upcoming appointment"
-- self-reminder OFF, while the core master alerts default ON. Existing rows are
-- backfilled with these defaults.
-- Idempotent: safe to re-run.

ALTER TABLE public.master_settings
  ADD COLUMN IF NOT EXISTS client_reminder_whatsapp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_reminder_offsets_minutes smallint[] NOT NULL DEFAULT '{1440,120}'::smallint[],
  ADD COLUMN IF NOT EXISTS alert_new_booking_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_awaiting_confirmation_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_cancellation_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_upcoming_appointment_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alert_upcoming_offset_minutes integer NOT NULL DEFAULT 60;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_settings_alert_upcoming_offset_minutes_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_alert_upcoming_offset_minutes_check
      CHECK (alert_upcoming_offset_minutes >= 0);
  END IF;

  -- Keep the reminder offsets array sane: bounded length, positive values.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_settings_client_reminder_offsets_minutes_check'
  ) THEN
    ALTER TABLE public.master_settings
      ADD CONSTRAINT master_settings_client_reminder_offsets_minutes_check
      CHECK (
        array_length(client_reminder_offsets_minutes, 1) IS NULL
        OR (
          array_length(client_reminder_offsets_minutes, 1) <= 10
          AND 0 < ALL (client_reminder_offsets_minutes)
        )
      );
  END IF;
END $$;
