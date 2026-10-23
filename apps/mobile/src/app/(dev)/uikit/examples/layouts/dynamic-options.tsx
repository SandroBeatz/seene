import { useState } from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Card, Screen, Text } from '@/shared/ui';

export default function DynamicStackOptionsExample() {
  const { t } = useTranslation();
  const [alternate, setAlternate] = useState(false);
  const title = alternate ? t('uikit.layout.dynamicAlternateTitle') : t('uikit.layout.dynamic');

  return (
    <Screen edges={['left', 'right']} contentStyle={styles.content}>
      <Stack.Screen options={{ title }} />
      <Card>
        <Text variant="body">{t('uikit.layout.dynamicDescription')}</Text>
      </Card>
      <Button
        label={t('uikit.layout.changeTitle')}
        variant="secondary"
        onPress={() => setAlternate((value) => !value)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[4] },
}));
