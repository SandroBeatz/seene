import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useReactivateAccount, useSessionStore } from '@/entities/session';
import { Button, EmptyState, Screen } from '@/shared/ui';

const GRACE_DAYS = 30;

/**
 * Where a master lands after asking to delete the account: the app is closed to them
 * until they restore it or the 30 days run out and the data is removed.
 */
export default function AccountDeactivatedScreen() {
  const { t, i18n } = useTranslation();
  const signOut = useSessionStore((state) => state.signOut);
  const deactivatedAt = useSessionStore((state) => state.profile?.deactivated_at);
  const reactivate = useReactivateAccount();
  const date = deactivatedAt
    ? DateTime.fromISO(deactivatedAt)
        .plus({ days: GRACE_DAYS })
        .setLocale(i18n.language)
        .toLocaleString(DateTime.DATE_FULL)
    : '';

  return (
    <Screen center edges={['top', 'right', 'bottom', 'left']}>
      <EmptyState
        icon="warning"
        title={t('account.deactivatedTitle')}
        description={t('account.deactivatedDescription', { date })}
      />
      <View style={styles.actions}>
        <Button
          label={t('account.restore')}
          loading={reactivate.isPending}
          onPress={() =>
            reactivate.mutate(undefined, {
              onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
            })
          }
        />
        <Button
          label={t('auth.logOut')}
          variant="ghost"
          tone="secondary"
          onPress={() => void signOut()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  actions: { alignSelf: 'stretch', gap: theme.space[2], paddingHorizontal: theme.space[4] },
}));
