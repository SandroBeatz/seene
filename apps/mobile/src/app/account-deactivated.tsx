import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/entities/session';
import { EmptyState, Screen } from '@/shared/ui';

/**
 * Terminal state for a master whose profile is soft-deleted (`deactivated_at`). The
 * root guard routes here instead of signing them out silently; from here they can
 * only sign out (reactivation/support lands with the account settings feature).
 */
export default function AccountDeactivatedScreen() {
  const { t } = useTranslation();
  const signOut = useSessionStore((state) => state.signOut);

  return (
    <Screen center edges={['top', 'right', 'bottom', 'left']}>
      <EmptyState
        icon="warning"
        title={t('account.deactivatedTitle')}
        description={t('account.deactivatedDescription')}
        actionLabel={t('auth.logOut')}
        onAction={() => void signOut()}
      />
    </Screen>
  );
}
