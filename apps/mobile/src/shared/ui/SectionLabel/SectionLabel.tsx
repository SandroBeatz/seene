/**
 * Small uppercase label above a group ("МАНИКЮР", "РАБОЧИЕ ДНИ"), with an optional
 * trailing note on the same line ("необязательно", "1 ч 30 мин", "0 из 3").
 */
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/ui/Text';

export interface SectionLabelProps {
  label: string;
  trailing?: string;
  /** Ink, bold trailing value (a live summary) instead of a muted note. */
  trailingStrong?: boolean;
}

export function SectionLabel({ label, trailing, trailingStrong = false }: SectionLabelProps) {
  return (
    <View style={styles.row}>
      <Text variant="overline" color="secondary" accessibilityRole="header">
        {label}
      </Text>
      {trailing ? (
        <Text
          variant={trailingStrong ? 'captionStrong' : 'caption'}
          color={trailingStrong ? 'primary' : 'secondary'}>
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
}));
