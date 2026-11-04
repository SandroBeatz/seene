/**
 * The appointment note (design "Запись · заметка", "заметки нет"): a private text up
 * to 300 characters with quick chips for the usual remarks. Saving an empty note
 * removes it.
 */
import { router } from 'expo-router';
import { useUpdateAppointmentMutation, type Appointment } from '@/entities/appointment';
import { useUserId } from '@/entities/session';
import { NOTE_MAX_LENGTH, useNoteSheetText } from '@/shared/lib/note';
import { NoteSheet, showFailedToast } from '@/shared/ui';
import { useVisitSavedToast } from '../model/useVisitSavedToast';

export function NoteEditor({ appointment }: { appointment: Appointment }) {
  const update = useUpdateAppointmentMutation(useUserId() ?? '');
  const { labels, chips, locale } = useNoteSheetText();
  const showSaved = useVisitSavedToast(appointment);

  return (
    <NoteSheet
      initial={appointment.notes}
      maxLength={NOTE_MAX_LENGTH}
      chips={chips}
      locale={locale}
      labels={labels}
      saving={update.isPending}
      onSave={(notes) =>
        update.mutate(
          { id: appointment.id, notes },
          {
            onSuccess: () => {
              showSaved();
              router.back();
            },
            onError: () => showFailedToast(),
          },
        )
      }
    />
  );
}
