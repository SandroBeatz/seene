/**
 * The client note from the profile ("Заметка о клиенте" / "Добавить заметку о
 * клиенте"): just the note, in the same sheet as the appointment note.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useUpdateClientMutation, type Client } from '@/entities/client';
import { useUserId } from '@/entities/session';
import { useNoteSheetText } from '@/shared/lib/note';
import { NoteSheet } from '@/shared/ui';

/** Same limit as the note field of the client form. */
export const CLIENT_NOTE_MAX_LENGTH = 1000;

export function ClientNoteEditor({ client }: { client: Client }) {
  const { t } = useTranslation();
  const update = useUpdateClientMutation(useUserId() ?? '');
  const { labels, chips, locale } = useNoteSheetText();

  return (
    <NoteSheet
      initial={client.notes}
      maxLength={CLIENT_NOTE_MAX_LENGTH}
      chips={chips}
      locale={locale}
      labels={{ ...labels, title: t('clients.profile.note'), titleNew: t('clients.form.addNote') }}
      saving={update.isPending}
      onSave={(notes) =>
        update.mutate(
          { id: client.id, notes },
          {
            onSuccess: () => router.back(),
            onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
          },
        )
      }
    />
  );
}
