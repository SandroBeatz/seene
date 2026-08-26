import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { QuickCreateStep } from '@/widgets/quick-create-flow';
import { IconButton } from '@/shared/ui';

export default function QuickCreateStartScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <IconButton
              icon="close"
              accessibilityLabel={t('common.close')}
              variant="ghost"
              onPress={() => router.dismiss()}
            />
          ),
        }}
      />
      <QuickCreateStep
        title={t('quickCreate.startTitle')}
        description={t('quickCreate.startDescription')}
        actionLabel={t('common.continue')}
        onAction={() => router.push('/quick-create/client')}
      />
    </>
  );
}
