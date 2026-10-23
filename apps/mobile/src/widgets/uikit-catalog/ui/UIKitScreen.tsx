import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Badge, type BadgeTone, Card, ScreenScrollView, Text } from '@/shared/ui';

export function UIKitScreen({ children }: { children: ReactNode }) {
  return <ScreenScrollView contentContainerStyle={styles.screen}>{children}</ScreenScrollView>;
}

export interface UIKitExampleCardProps {
  title: string;
  description: string;
  recommendation: string;
  source: string;
  code?: string;
  badge?: string;
  badgeTone?: BadgeTone;
  action?: ReactNode;
}

export function UIKitExampleCard({
  title,
  description,
  recommendation,
  source,
  code,
  badge,
  badgeTone = 'neutral',
  action,
}: UIKitExampleCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Text variant="title3" style={styles.title}>
          {title}
        </Text>
        {badge ? <Badge label={badge} tone={badgeTone} /> : null}
      </View>
      <Text variant="body" color="secondary">
        {description}
      </Text>
      <Text variant="footnote">{recommendation}</Text>
      <View style={styles.codeBox}>
        <Text variant="caption" color="secondary" selectable>
          {source}
        </Text>
        {code ? (
          <Text variant="caption" selectable>
            {code}
          </Text>
        ) : null}
      </View>
      {action}
    </Card>
  );
}

export function UIKitSectionTitle({ children }: { children: ReactNode }) {
  return <Text variant="title2">{children}</Text>;
}

const styles = StyleSheet.create((theme) => ({
  screen: { gap: theme.space[4] },
  card: { gap: theme.space[3] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  title: { flex: 1 },
  codeBox: {
    gap: theme.space[1],
    padding: theme.space[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.sunken,
  },
}));
