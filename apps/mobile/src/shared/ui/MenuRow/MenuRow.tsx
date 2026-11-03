/**
 * The main menu's rows (design "Таб · Меню"): a labelled group on a grey card, and a
 * row with a line icon, a title, a muted value and a chevron.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { GroupedCard } from '@/shared/ui/GroupedCard';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { ListItem } from '@/shared/ui/ListItem';
import { SectionLabel } from '@/shared/ui/SectionLabel';

export interface MenuGroupProps {
  /** Uppercase label above the card; a group without one sits closer to the previous. */
  label?: string;
  children: ReactNode;
}

export function MenuGroup({ label, children }: MenuGroupProps) {
  return (
    <View style={label ? styles.labelled : styles.plain}>
      {label ? (
        <View style={styles.label}>
          <SectionLabel label={label} />
        </View>
      ) : null}
      <GroupedCard variant="menu">{children}</GroupedCard>
    </View>
  );
}

export interface MenuRowProps {
  icon: IconName;
  title: string;
  value?: string;
  /** Without it the row only shows its value: no chevron. */
  onPress?: () => void;
}

export function MenuRow({ icon, title, value, onPress }: MenuRowProps) {
  return (
    <ListItem
      size="menu"
      inset={false}
      left={
        <View style={styles.icon}>
          <Icon name={icon} size="md" weight="light" />
        </View>
      }
      title={title}
      trailingText={value}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  labelled: { marginTop: theme.space[5.5] },
  plain: { marginTop: theme.space[3.5] },
  label: { marginHorizontal: theme.space[1], marginBottom: theme.space[2] },
  icon: { width: theme.sizing.icon.lg, alignItems: 'center', justifyContent: 'center' },
}));
