import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button, Card, GlassSurface, Icon, Screen, Text } from '@/shared/ui';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <Text variant="title1">{t('tabs.home')}</Text>
        <Card>
          <Text variant="body" color="secondary">
            Phase 0 foundation is live. Product features land from Phase 1 (auth & onboarding).
          </Text>
        </Card>
        <Link href="/ui-guide" asChild>
          <Button label="Open UI kit gallery" variant="secondary" />
        </Link>
      </View>

      {/* Floating glass action. Offset above the native tab bar via the safe-area
          inset; GlassSurface renders Liquid Glass on iOS 26 and a tokened elevated
          surface everywhere else (docs/liquid-glass-ios.md §5, §7.2). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create"
        onPress={() => {}}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + theme.space[16] },
          pressed && styles.fabPressed,
        ]}>
        <GlassSurface isInteractive style={styles.fabGlass}>
          <Icon name="add" size="lg" color="content.primary" />
        </GlassSurface>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  fab: {
    position: 'absolute',
    right: theme.space[5],
    width: theme.sizing.avatar.lg,
    height: theme.sizing.avatar.lg,
    borderRadius: theme.radius.full,
    ...theme.elevation[2],
  },
  fabPressed: { opacity: 0.8 },
  fabGlass: {
    flex: 1,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
}));
