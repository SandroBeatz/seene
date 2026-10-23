import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { Screen, Text } from '@/shared/ui';

export default function SessionRestoringScreen() {
  const { t } = useTranslation();

  return (
    <Screen center edges={['top', 'right', 'bottom', 'left']} contentStyle={styles.content}>
      <ActivityIndicator />
      <Text variant="subhead" color="secondary">
        {t('navigation.restoringSession')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[3] },
}));
