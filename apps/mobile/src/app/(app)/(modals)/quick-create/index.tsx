import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { QuickCreateStep } from '@/widgets/quick-create-flow';
import { IconButton } from '@/shared/ui';

export default function QuickCreateStartScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const isIOS = process.env.EXPO_OS === 'ios';

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: isIOS
            ? undefined
            : () => (
                <IconButton
                  icon="close"
                  accessibilityLabel={t('common.close')}
                  variant="ghost"
                  onPress={() => router.dismissTo('/')}
                />
              ),
        }}
      />
      {isIOS ? (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            icon="xmark"
            accessibilityLabel={t('common.close')}
            tintColor={theme.colors.content.primary}
            variant="plain"
            onPress={() => router.dismissTo('/')}
          />
        </Stack.Toolbar>
      ) : null}
      <QuickCreateStep
        title={t('quickCreate.startTitle')}
        description={t('quickCreate.startDescription')}
        actionLabel={t('common.continue')}
        onAction={() => router.push('/quick-create/client')}
      />
    </>
  );
}
