/**
 * Content header for native form sheets: grabber, a round close/back button, a
 * centred title (with optional subtitle) and an optional trailing action. Native
 * sheets on Android render no header, so the same content header is used on both
 * platforms and the native grabber stays hidden.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { IconButton } from '@/shared/ui/IconButton';
import { Text } from '@/shared/ui/Text';

export interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  /** `close` dismisses the sheet; `back` returns to the parent sheet. */
  leading?: 'close' | 'back';
  onLeadingPress?: () => void;
  leadingLabel: string;
  trailing?: ReactNode;
  showGrabber?: boolean;
}

export function SheetHeader({
  title,
  subtitle,
  leading = 'close',
  onLeadingPress,
  leadingLabel,
  trailing,
  showGrabber = true,
}: SheetHeaderProps) {
  return (
    <View style={styles.container}>
      {showGrabber ? <View style={styles.grabber} /> : null}
      <View style={styles.row}>
        <IconButton
          icon={leading === 'close' ? 'close' : 'chevronLeft'}
          iconSize={leading === 'close' ? 'sm' : 'base'}
          variant="neutral"
          accessibilityLabel={leadingLabel}
          onPress={onLeadingPress}
        />
        <View style={styles.titles}>
          <Text variant="headline" align="center" accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color="secondary" align="center" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.side}>{trailing}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { paddingTop: theme.space[2.5], gap: theme.space[1.5] },
  grabber: {
    alignSelf: 'center',
    width: theme.sizing.grabber.width,
    height: theme.sizing.grabber.height,
    borderRadius: theme.radius.bar,
    backgroundColor: theme.colors.border.default,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingTop: theme.space[1.5],
    paddingHorizontal: theme.space[4],
  },
  titles: { flex: 1, alignItems: 'center', gap: theme.space[0.25] },
  side: { width: theme.sizing.iconButton, alignItems: 'flex-end' },
}));
