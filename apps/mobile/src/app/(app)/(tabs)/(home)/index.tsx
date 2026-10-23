import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button, Card, GlassSurface, Icon, ScreenScrollView, Text } from '@/shared/ui';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScreenScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text variant="body" color="secondary">
            {t('placeholders.home')}
          </Text>
        </Card>

        <Link
          href={{
            pathname: '/(app)/(tabs)/(home)/appointments/[appointmentId]',
            params: { appointmentId: 'demo-appointment', source: 'home' },
          }}
          asChild>
          <Button label={t('navigation.openSharedAppointment')} variant="secondary" />
        </Link>

        {__DEV__ ? (
          <Link href="/uikit" asChild>
            <Button label={t('uikit.openCatalog')} variant="ghost" />
          </Link>
        ) : null}
      </ScreenScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('navigation.quickCreate')}
        onPress={() => router.push('/quick-create')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + theme.space[16] },
          pressed && styles.fabPressed,
        ]}>
        <GlassSurface isInteractive style={styles.fabGlass}>
          <Icon name="add" size="lg" color="content.primary" />
        </GlassSurface>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: { gap: theme.space[4] },
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
