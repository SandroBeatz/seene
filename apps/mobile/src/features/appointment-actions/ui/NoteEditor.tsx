/**
 * The appointment note (design "Запись · заметка", "заметки нет"): a private text up
 * to 300 characters with quick chips for the usual remarks. Saving an empty note
 * removes it.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useUpdateAppointmentMutation, type Appointment } from '@/entities/appointment';
import { useUserId } from '@/entities/session';
import { Button, FormScreen, Icon, IconButton, Text } from '@/shared/ui';
import { appendChip, NOTE_MAX_LENGTH } from '../model/note';

const CHIPS = ['allergy', 'favouriteShade', 'sensitiveSkin', 'runsLate'] as const;

export function NoteEditor({ appointment }: { appointment: Appointment }) {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const userId = useUserId() ?? '';
  const update = useUpdateAppointmentMutation(userId);
  const existing = appointment.notes?.trim() ?? '';
  const [note, setNote] = useState(existing);

  const save = (value: string | null) =>
    update.mutate(
      { id: appointment.id, notes: value },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
      },
    );

  const canSave = note.trim() !== existing && (note.trim() !== '' || existing !== '');

  return (
    <FormScreen
      contentContainerStyle={styles.content}
      footer={
        <Button
          label={t('common.save')}
          disabled={!canSave}
          loading={update.isPending}
          onPress={() => save(note.trim() || null)}
          fullWidth
        />
      }>
      <View style={styles.grabber} />
      <View style={styles.header}>
        <Text variant="title3">{existing ? t('note.title') : t('note.titleNew')}</Text>
        <IconButton
          icon="close"
          accessibilityLabel={t('common.close')}
          variant="neutral"
          onPress={() => router.back()}
        />
      </View>

      <View style={styles.field}>
        <TextInput
          accessibilityLabel={t('note.field')}
          value={note}
          onChangeText={(value) => setNote(value.slice(0, NOTE_MAX_LENGTH))}
          placeholder={t('note.placeholder')}
          placeholderTextColor={theme.colors.content.tertiary}
          multiline
          autoFocus
          maxLength={NOTE_MAX_LENGTH}
          style={styles.input}
        />
        <View style={styles.meta}>
          <View style={styles.inline}>
            <Icon name="lock" size={13} color="content.tertiary" />
            <Text variant="caption" color="tertiary">
              {t('note.private')}
            </Text>
          </View>
          <Text variant="caption" color="tertiary" tabularNums>
            {`${note.length} / ${NOTE_MAX_LENGTH}`}
          </Text>
        </View>
      </View>

      <View style={styles.chips}>
        {CHIPS.map((chip) => (
          <Pressable
            key={chip}
            accessibilityRole="button"
            onPress={() =>
              setNote((current) => appendChip(current, t(`note.chips.${chip}`), i18n.language))
            }
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
            <Icon name="add" size={13} color="content.secondary" />
            <Text variant="footnote">{t(`note.chips.${chip}`)}</Text>
          </Pressable>
        ))}
      </View>

      {existing ? (
        <Button
          label={t('note.delete')}
          variant="ghost"
          onPress={() => save(null)}
          disabled={update.isPending}
        />
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[3.5] },
  grabber: {
    alignSelf: 'center',
    marginTop: theme.space[2],
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border.default,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  field: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.space[3.5],
    gap: theme.space[2.5],
  },
  input: {
    minHeight: 110,
    textAlignVertical: 'top',
    color: theme.colors.content.primary,
    ...theme.typography.body,
  },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] },
  chip: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    paddingHorizontal: theme.space[3],
    borderRadius: 17,
    backgroundColor: theme.colors.bg.surface,
  },
  pressed: { opacity: 0.7 },
}));
