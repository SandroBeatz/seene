/**
 * The long-press menu (design "Карточка внимания · долгое нажатие", "Запись в
 * расписании · долгое нажатие"): over a dim scrim, the pressed card lifted where it
 * was, the booking note under it, then the action groups — a regular one and a red
 * one. The stack moves up when it would run off the bottom of the screen.
 */
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

export interface ContextMenuItem {
  key: string;
  label: string;
  icon: IconName;
  danger?: boolean;
}

/** Where the pressed card sits on screen (`measureInWindow`). */
export interface ContextMenuAnchor {
  x: number;
  y: number;
  width: number;
}

export interface ContextMenuProps {
  /** Null = closed. */
  anchor: ContextMenuAnchor | null;
  /** The card as it looked when pressed; absent for a menu under a "⋯" button. */
  preview?: ReactNode;
  /** The note it was booked with, if any. */
  note?: { label: string; text: string } | null;
  items: ContextMenuItem[];
  closeLabel: string;
  onClose: () => void;
  onSelect: (key: string) => void;
}

const GAP = 10;
const EDGE = 16;

export function ContextMenu({
  anchor,
  preview,
  note,
  items,
  closeLabel,
  onClose,
  onSelect,
}: ContextMenuProps) {
  const insets = useSafeAreaInsets();
  const screen = useWindowDimensions();
  const [height, setHeight] = useState(0);

  const regular = items.filter((i) => !i.danger);
  const danger = items.filter((i) => i.danger);

  const group = (list: ContextMenuItem[]) =>
    list.length ? (
      <View style={styles.group}>
        {list.map((item, index) => (
          <Pressable
            key={item.key}
            accessibilityRole="menuitem"
            onPress={() => {
              onClose();
              onSelect(item.key);
            }}
            style={({ pressed }) => [
              styles.item,
              index > 0 && styles.divider,
              pressed && styles.pressed,
            ]}>
            <Text
              variant="bodyMedium"
              numberOfLines={1}
              style={[styles.grow, item.danger && styles.dangerText]}>
              {item.label}
            </Text>
            <Icon
              name={item.icon}
              size="base"
              color={item.danger ? 'tone.danger.fg' : 'content.secondary'}
            />
          </Pressable>
        ))}
      </View>
    ) : null;

  const top = anchor
    ? Math.max(
        insets.top + EDGE,
        Math.min(anchor.y, screen.height - insets.bottom - EDGE - height),
      )
    : 0;

  return (
    <Modal
      visible={!!anchor}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={() => setHeight(0)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        style={styles.scrim}
        onPress={onClose}
      />
      {anchor ? (
        <View
          onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
          // Measured first, then shown in place: no jump.
          style={[
            styles.stack,
            { top, left: anchor.x, width: anchor.width, opacity: height ? 1 : 0 },
          ]}>
          {preview ? <View style={styles.lifted}>{preview}</View> : null}
          {note ? (
            <View style={styles.note}>
              <Icon name="note" size={14} color="content.secondary" />
              <View style={styles.grow}>
                <Text variant="caption2Strong" color="tertiary">
                  {note.label}
                </Text>
                <Text variant="footnote">{note.text}</Text>
              </View>
            </View>
          ) : null}
          <View accessibilityRole="menu" style={styles.menu}>
            {group(regular)}
            {group(danger)}
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay.scrim },
  stack: { position: 'absolute', gap: GAP },
  lifted: { boxShadow: theme.shadow.menu, borderRadius: theme.radius.lg },
  note: {
    flexDirection: 'row',
    gap: theme.space[2.5],
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.field,
    backgroundColor: theme.colors.bg.elevated,
    boxShadow: theme.shadow.menu,
  },
  menu: { width: 264, gap: theme.space[2] },
  group: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.overlay.menu,
    overflow: 'hidden',
    boxShadow: theme.shadow.menu,
  },
  item: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingHorizontal: theme.space[4],
  },
  divider: { borderTopWidth: 1, borderTopColor: theme.colors.border.subtle },
  pressed: { backgroundColor: theme.colors.interaction.onSurfacePressed },
  grow: { flex: 1, minWidth: 0, gap: 3 },
  dangerText: { color: theme.colors.tone.danger.fg },
}));
