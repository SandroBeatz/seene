-- "Спасибо за визит" and "Вы не пришли": what the "Шаблон" button offers for a visit that is over.
ALTER TABLE public.message_template
  DROP CONSTRAINT message_template_kind,
  ADD CONSTRAINT message_template_kind CHECK (
    kind IN (
      'confirmation', 'reminder', 'recall', 'cancellation', 'reschedule', 'day_off',
      'thanks', 'missed'
    )
  );
