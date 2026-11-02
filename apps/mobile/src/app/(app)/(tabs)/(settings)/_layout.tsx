import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { initialRouteName: 'settings/index' };

export default function SettingsStackLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen
        name="settings/index"
        // No bar in the design: the master's card heads the screen.
        options={{ title: t('tabs.menu'), headerShown: false }}
      />
    </Stack>
  );
}
