/**
 * Big screen title + the explanatory line under it (Inter Tight 30 / body 15,
 * 8pt apart) — the heading of every auth and onboarding step.
 */
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/ui/Text';

export interface ScreenTitleProps {
  title: string;
  subtitle?: string;
}

export function ScreenTitle({ title, subtitle }: ScreenTitleProps) {
  return (
    <View style={styles.root}>
      <Text variant="display" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" color="secondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { gap: theme.space[2] },
}));
