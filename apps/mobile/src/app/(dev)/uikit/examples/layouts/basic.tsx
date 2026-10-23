import { useTranslation } from 'react-i18next';
import { Card, Screen, Text } from '@/shared/ui';

export default function BasicScreenExample() {
  const { t } = useTranslation();
  return (
    <Screen edges={['left', 'right']}>
      <Card>
        <Text variant="body">{t('uikit.layout.basicDescription')}</Text>
      </Card>
    </Screen>
  );
}
