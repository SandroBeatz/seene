import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeStackLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen
        name="index"
        // "Сегодня" draws its own header (avatar, greeting, analytics).
        options={{ title: t('tabs.today'), headerShown: false }}
      />
    </Stack>
  );
}
