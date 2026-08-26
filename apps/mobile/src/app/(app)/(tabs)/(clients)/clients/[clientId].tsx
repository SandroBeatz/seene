import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { Card, ScreenScrollView, Text } from '@/shared/ui';

export default function ClientDetailsScreen() {
  const { t } = useTranslation();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();

  return (
    <>
      <Stack.Screen options={{ title: t('navigation.clientDetails') }} />
      <ScreenScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text variant="title3">{t('navigation.dynamicRoute')}</Text>
          <Text variant="body" color="secondary">
            {t('navigation.routeParameter', { value: clientId })}
          </Text>
        </Card>
      </ScreenScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[4] },
}));
