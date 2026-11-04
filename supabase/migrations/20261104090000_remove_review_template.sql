-- The MVP has no client reviews (design notes of 4 Nov): the "review" message template goes.
DELETE FROM public.message_template WHERE kind = 'review';

ALTER TABLE public.message_template
  DROP CONSTRAINT message_template_kind,
  ADD CONSTRAINT message_template_kind CHECK (
    kind IN ('confirmation', 'reminder', 'recall', 'cancellation', 'reschedule')
  );
