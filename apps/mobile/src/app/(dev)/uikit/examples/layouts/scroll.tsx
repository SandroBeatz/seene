import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { Card, ScreenScrollView, Text } from '@/shared/ui';

export default function ScrollScreenExample() {
  const { t } = useTranslation();
  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      {Array.from({ length: 14 }, (_, index) => (
        <Card key={index}>
          <Text variant="body">{t('uikit.row', { value: index + 1 })}</Text>
        </Card>
      ))}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({ content: { gap: theme.space[3] } }));
