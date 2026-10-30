/**
 * The note an appointment was booked with, opened from the note icon on a schedule
 * card (design "Таб · Сегодня"): a bottom card over a light scrim.
 */
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Icon, Text } from '@/shared/ui';

export interface NoteBubbleProps {
  /** Null = closed. */
  note: { clientName: string; text: string } | null;
  onClose: () => void;
}

export function NoteBubble({ note, onClose }: NoteBubbleProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={!!note} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('today.note.close')}
        style={styles.scrim}
        onPress={onClose}
      />
      {note ? (
        <View
          accessibilityViewIsModal
          style={[styles.card, { bottom: Math.max(insets.bottom - 6, 16) }]}>
          <View style={styles.head}>
            <Icon name="note" size={14} color="content.secondary" />
            <Text variant="captionStrong" color="secondary" numberOfLines={1} style={styles.shrink}>
              {t('today.note.from', { name: note.clientName })}
            </Text>
          </View>
          <Text variant="body">{note.text}</Text>
          <Button label={t('common.close')} variant="secondary" onPress={onClose} />
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay.scrimLight },
  card: {
    position: 'absolute',
    left: theme.space[3],
    right: theme.space[3],
    gap: theme.space[2.5],
    paddingTop: theme.space[4.5],
    paddingHorizontal: theme.space[4.5],
    paddingBottom: theme.space[3.5],
    borderRadius: theme.radius.showcase,
    backgroundColor: theme.colors.bg.elevated,
    boxShadow: theme.shadow.bubble,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  shrink: { flexShrink: 1 },
}));
