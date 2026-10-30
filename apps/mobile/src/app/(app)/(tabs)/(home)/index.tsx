import { useState } from 'react';
import { Link, router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ProfileCreatedModal, profileCreatedNotice } from '@/features/onboarding';
import { Button, Card, IconButton, ScreenScrollView, Text } from '@/shared/ui';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const isIOS = process.env.EXPO_OS === 'ios';
  // Once, right after onboarding.
  const [profileCreated, setProfileCreated] = useState(profileCreatedNotice.isPending);

  function closeProfileCreated() {
    profileCreatedNotice.clear();
    setProfileCreated(false);
  }

  return (
    <View style={styles.root}>
      {/* Analytics left the tab bar; Phase 2 moves this into the designed header. */}
      <Stack.Screen
        options={{
          headerRight: isIOS
            ? undefined
            : () => (
                <IconButton
                  icon="analytics"
                  accessibilityLabel={t('tabs.analytics')}
                  variant="ghost"
                  onPress={() => router.push('/analytics')}
                />
              ),
        }}
      />
      {isIOS ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="chart.bar"
            accessibilityLabel={t('tabs.analytics')}
            tintColor={theme.colors.content.primary}
            variant="plain"
            onPress={() => router.push('/analytics')}
          />
        </Stack.Toolbar>
      ) : null}
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

      <ProfileCreatedModal
        visible={profileCreated}
        onFillProfile={() => {
          closeProfileCreated();
          router.push('/settings/profile');
        }}
        onLater={closeProfileCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: { gap: theme.space[4] },
}));
