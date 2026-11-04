-- "Перенос из-за отпуска" (design AppSendDayOff): what clients get when a vacation or a day off
-- falls on their visit.
ALTER TABLE public.message_template
  DROP CONSTRAINT message_template_kind,
  ADD CONSTRAINT message_template_kind CHECK (
    kind IN ('confirmation', 'reminder', 'recall', 'cancellation', 'reschedule', 'day_off')
  );
