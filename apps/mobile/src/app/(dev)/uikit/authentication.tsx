import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/entities/session';
import { Button, Modal, Text } from '@/shared/ui';
import { UIKitExampleCard, UIKitScreen } from '@/widgets/uikit-catalog';

export default function UIKitAuthenticationScreen() {
  const { t } = useTranslation();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const session = useSessionStore((state) => state.session);
  const profile = useSessionStore((state) => state.profile);
  const isInitialized = useSessionStore((state) => state.isInitialized);
  const isSyncing = useSessionStore((state) => state.isSyncing);
  const signOut = useSessionStore((state) => state.signOut);

  return (
    <>
      <UIKitScreen>
        <UIKitExampleCard
          title={t('uikit.auth.restoration')}
          description={t('uikit.auth.restorationDescription')}
          recommendation={t('uikit.recommended.authRestore')}
          source="src/app/session-restoring.tsx"
          code={`initialized=${String(isInitialized)} syncing=${String(isSyncing)}`}
        />
        <UIKitExampleCard
          title={t('uikit.auth.protected')}
          description={t('uikit.auth.protectedDescription')}
          recommendation={t('uikit.recommended.protected')}
          source="src/app/_layout.tsx"
          code={'<Stack.Protected guard={canUseApp}>…</Stack.Protected>'}
          badge={t('uikit.active')}
          badgeTone="success"
        />
        <UIKitExampleCard
          title={t('uikit.auth.public')}
          description={t('uikit.auth.publicDescription')}
          recommendation={t('uikit.recommended.publicRoute')}
          source="src/app/(auth)/sign-in/index.tsx"
          code={'<Stack.Protected guard={canUseAuth}>…</Stack.Protected>'}
        />
        <UIKitExampleCard
          title={t('uikit.auth.returnTo')}
          description={t('uikit.auth.returnToDescription')}
          recommendation={t('uikit.recommended.returnTo')}
          source="src/shared/lib/navigation/useAuthReturnIntent.ts"
          code="appmasterseene://appointments/uikit-appointment"
        />
        <UIKitExampleCard
          title={t('uikit.auth.currentSession')}
          description={t('uikit.auth.currentSessionDescription', {
            user: session?.user.email ?? '—',
            profile: profile?.username ?? '—',
          })}
          recommendation={t('uikit.recommended.signOut')}
          source="src/entities/session/model/session.store.ts"
          code="signOut() → protected history removed"
          action={
            <Button
              label={t('auth.logOut')}
              variant="danger"
              onPress={() => setConfirmSignOut(true)}
            />
          }
        />
      </UIKitScreen>

      <Modal
        visible={confirmSignOut}
        onRequestClose={() => setConfirmSignOut(false)}
        title={t('uikit.auth.signOutTitle')}
        footer={
          <>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={() => setConfirmSignOut(false)}
            />
            <Button
              label={t('auth.logOut')}
              variant="danger"
              onPress={() => {
                setConfirmSignOut(false);
                void signOut();
              }}
            />
          </>
        }>
        <Text variant="body" color="secondary">
          {t('uikit.auth.signOutDescription')}
        </Text>
      </Modal>
    </>
  );
}
