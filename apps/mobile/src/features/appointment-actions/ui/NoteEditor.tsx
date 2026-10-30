/**
 * The appointment note (design "Запись · заметка", "заметки нет"): a private text up
 * to 300 characters with quick chips for the usual remarks. Saving an empty note
 * removes it.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useUpdateAppointmentMutation, type Appointment } from '@/entities/appointment';
import { useUserId } from '@/entities/session';
import { NOTE_MAX_LENGTH, useNoteSheetText } from '@/shared/lib/note';
import { NoteSheet } from '@/shared/ui';

export function NoteEditor({ appointment }: { appointment: Appointment }) {
  const { t } = useTranslation();
  const update = useUpdateAppointmentMutation(useUserId() ?? '');
  const { labels, chips, locale } = useNoteSheetText();

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
            onSuccess: () => router.back(),
            onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
          },
        )
      }
    />
  );
}
