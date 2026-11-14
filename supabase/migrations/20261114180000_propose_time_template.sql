-- "Предложить другое время": the master picks free slots and sends them to the client.
ALTER TABLE public.message_template
  DROP CONSTRAINT message_template_kind,
  ADD CONSTRAINT message_template_kind CHECK (
    kind IN (
      'confirmation', 'reminder', 'recall', 'cancellation', 'reschedule', 'day_off',
      'thanks', 'missed', 'propose_time'
    )
  );
