/**
 * Top of the email/code steps: round back button, then the title and the
 * explanatory line 28pt below it (design: AppEmail / AppCode).
 */
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { IconButton, Text } from '@/shared/ui';

export interface AuthHeadingProps {
  title: string;
  subtitle: string;
  onBack: () => void;
}

export function AuthHeading({ title, subtitle, onBack }: AuthHeadingProps) {
  const { t } = useTranslation();
  return (
    <View>
      <IconButton
        icon="chevronLeft"
        variant="neutral"
        accessibilityLabel={t('common.back')}
        onPress={onBack}
      />
      <View style={styles.copy}>
        <Text variant="display" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="body" color="secondary">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  copy: { marginTop: theme.space[7], gap: theme.space[2] },
}));
