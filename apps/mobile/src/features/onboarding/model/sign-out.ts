/** Leaving onboarding from step 1 = signing out, confirmed in a native dialog. */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/entities/session';
import { showAlert } from '@/shared/lib/haptics';

export function useConfirmSignOut(): () => void {
  const { t } = useTranslation();
  const signOut = useSessionStore((state) => state.signOut);
  return useCallback(() => {
    showAlert(t('onboarding.signOut.title'), t('onboarding.signOut.message'), [
      { text: t('onboarding.signOut.cancel'), style: 'cancel' },
      {
        text: t('onboarding.signOut.confirm'),
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  }, [signOut, t]);
}
