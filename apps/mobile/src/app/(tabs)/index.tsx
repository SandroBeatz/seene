import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, Card, Screen, Text } from '@/shared/ui';

export default function HomeScreen() {
  const { t } = useTranslation();
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
    </Screen>
  );
}
