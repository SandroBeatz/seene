/**
 * "Аккаунт" (design "Меню v2 · Аккаунт"): the plan on top, then the sign-in email,
 * sign out and deleting the account.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useDeactivateAccount, useSessionStore } from '@/entities/session';
import { showAlert } from '@/shared/lib/haptics';
import {
  Button,
  Icon,
  MenuGroup,
  MenuRow,
  ScreenScrollView,
  SectionLabel,
  Text,
  showFailedToast,
} from '@/shared/ui';

export function AccountScreen() {
  const { t } = useTranslation();
  const email = useSessionStore((state) => state.session?.user.email);
  const signOut = useSessionStore((state) => state.signOut);
  const deactivate = useDeactivateAccount();

  const confirmSignOut = () =>
    showAlert(t('menuHome.screen.logOutConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('menuHome.screen.logOut'),
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);

  const confirmDelete = () =>
    showAlert(t('menuHome.screen.deleteConfirm'), t('menuHome.screen.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('menuHome.screen.delete'),
        style: 'destructive',
        onPress: () =>
          deactivate.mutate(undefined, {
            onError: () => showFailedToast(),
          }),
      },
    ]);

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <View style={styles.label}>
        <SectionLabel label={t('menuHome.tariffs.title')} />
      </View>
      <View style={styles.plan}>
        <View style={styles.planRow}>
          <View style={styles.planIcon}>
            <Icon name="starOutline" size="md" weight="light" />
          </View>
          <View style={styles.planText}>
            <Text variant="bodyStrong">{t('menuHome.tariffs.currentPlan')}</Text>
            <Text variant="caption" color="secondary">
              {t('menuHome.account.planHint')}
            </Text>
          </View>
        </View>
        <Button
          label={t('menuHome.account.seePro')}
          onPress={() => router.push('/settings/tariffs')}
          fullWidth
        />
      </View>

      <MenuGroup label={t('menuHome.account.signIn')}>
        <MenuRow icon="mail" title={t('menuHome.screen.email')} value={email} />
        <MenuRow icon="logout" title={t('menuHome.screen.logOut')} onPress={confirmSignOut} />
      </MenuGroup>

      <Pressable
        accessibilityRole="button"
        disabled={deactivate.isPending}
        onPress={confirmDelete}
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}>
        <Text variant="subheadMedium" color="danger">
          {t('menuHome.screen.delete')}
        </Text>
      </Pressable>
      <Text variant="caption" color="secondary" align="center" style={styles.deleteHint}>
        {t('menuHome.account.deleteHint')}
      </Text>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    paddingHorizontal: theme.space[5],
    paddingTop: theme.space[3.5],
    paddingBottom: theme.space[10],
  },
  label: { marginHorizontal: theme.space[1], marginBottom: theme.space[2] },
  plan: {
    backgroundColor: theme.colors.bg.surface,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.space[3.5],
    paddingTop: theme.space[4],
    paddingBottom: theme.space[3.5],
    gap: theme.space[3],
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  planIcon: {
    width: theme.sizing.iconButton,
    height: theme.sizing.iconButton,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planText: { flex: 1, minWidth: 0, gap: 2 },
  delete: {
    marginTop: theme.space[4.5],
    height: theme.sizing.control.md,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space[4],
  },
  deleteHint: { marginHorizontal: theme.space[3] },
  pressed: { opacity: 0.6 },
}));
