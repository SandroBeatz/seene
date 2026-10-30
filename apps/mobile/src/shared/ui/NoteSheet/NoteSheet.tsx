/**
 * A private note in a sheet (design "Запись · заметка", "заметки нет"): the text with
 * a character count and "Видна только вам", quick chips for the usual remarks,
 * "Удалить заметку" when there is one. Saving an empty note removes it. Used for
 * the appointment note and the client note.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { appendChip } from '@/shared/lib/note';
import { Button } from '@/shared/ui/Button';
import { FormScreen } from '@/shared/ui/FormScreen';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { Text } from '@/shared/ui/Text';

export interface NoteSheetLabels {
  /** "Заметка" when editing, "Новая заметка" when empty. */
  title: string;
  titleNew: string;
  field: string;
  placeholder: string;
  private: string;
  delete: string;
  save: string;
  close: string;
}

export interface NoteSheetProps {
  initial: string | null;
  maxLength: number;
  /** Quick remarks appended to the text. */
  chips: readonly string[];
  locale: string;
  labels: NoteSheetLabels;
  saving: boolean;
  /** The trimmed text, or null to remove the note. */
  onSave: (value: string | null) => void;
}

export function NoteSheet({ initial, maxLength, chips, locale, labels, saving, onSave }: NoteSheetProps) {
  const { theme } = useUnistyles();
  const existing = initial?.trim() ?? '';
  const [note, setNote] = useState(existing);
  const canSave = note.trim() !== existing && (note.trim() !== '' || existing !== '');

  return (
    <FormScreen
      contentContainerStyle={styles.content}
      footer={
        <Button
          label={labels.save}
          disabled={!canSave}
          loading={saving}
          onPress={() => onSave(note.trim() || null)}
          fullWidth
        />
      }>
      <View style={styles.grabber} />
      <View style={styles.header}>
        <Text variant="title3">{existing ? labels.title : labels.titleNew}</Text>
        <IconButton
          icon="close"
          accessibilityLabel={labels.close}
          variant="neutral"
          onPress={() => router.back()}
        />
      </View>

      <View style={styles.field}>
        <TextInput
          accessibilityLabel={labels.field}
          value={note}
          onChangeText={(value) => setNote(value.slice(0, maxLength))}
          placeholder={labels.placeholder}
          placeholderTextColor={theme.colors.content.tertiary}
          multiline
          autoFocus
          maxLength={maxLength}
          style={styles.input}
        />
        <View style={styles.meta}>
          <View style={styles.inline}>
            <Icon name="lock" size={13} color="content.tertiary" />
            <Text variant="caption" color="tertiary">
              {labels.private}
            </Text>
          </View>
          <Text variant="caption" color="tertiary" tabularNums>
            {`${note.length} / ${maxLength}`}
          </Text>
        </View>
      </View>

      <View style={styles.chips}>
        {chips.map((chip) => (
          <Pressable
            key={chip}
            accessibilityRole="button"
            onPress={() => setNote((current) => appendChip(current, chip, locale, maxLength))}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
            <Icon name="add" size={13} color="content.secondary" />
            <Text variant="footnote">{chip}</Text>
          </Pressable>
        ))}
      </View>

      {existing ? (
        <Button label={labels.delete} variant="ghost" onPress={() => onSave(null)} disabled={saving} />
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
