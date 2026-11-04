/** "Настройки" (design AppMenuSettings). "Уведомления мне" joins with push notifications. */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  parseStoredSchedule,
  useMasterProfileQuery,
  useMasterSettingsQuery,
} from '@/entities/master';
import { useDeactivateAccount, useSessionStore, useUserId } from '@/entities/session';
import { zoneOffsetLabel } from '@/shared/config/time-zones';
import { isSupportedLocale, LOCALE_NATIVE_NAMES } from '@/shared/lib/i18n';
import { useThemeStore } from '@/shared/theme/theme.store';
import { Button, MenuGroup, MenuRow, ScreenScrollView, Text, showFailedToast } from '@/shared/ui';

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const themeMode = useThemeStore((state) => state.mode);
  const email = useSessionStore((state) => state.session?.user.email);
  const signOut = useSessionStore((state) => state.signOut);
  const deactivate = useDeactivateAccount();

  const timezone = parseStoredSchedule(profile.data?.schedule)?.timezone;
  const currency = settings.data?.currency;
  const language = isSupportedLocale(i18n.language)
    ? LOCALE_NATIVE_NAMES[i18n.language]
    : undefined;

  const confirmSignOut = () =>
    Alert.alert(t('menuHome.screen.logOutConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('menuHome.screen.logOut'),
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);

  const confirmDelete = () =>
    Alert.alert(t('menuHome.screen.deleteConfirm'), t('menuHome.screen.deleteText'), [
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
      <MenuGroup label={t('menuHome.screen.app')}>
        <MenuRow
          icon="globe"
          title={t('menuHome.screen.language')}
          value={language}
          onPress={() => router.push('/settings/language')}
        />
        <MenuRow
          icon="clock"
          title={t('menuHome.screen.timezone')}
          value={timezone ? zoneOffsetLabel(timezone) : undefined}
          onPress={() => router.push('/settings/timezone')}
        />
        <MenuRow
          icon="cash"
          title={t('menuHome.screen.currency')}
          value={currency ? t(`currencies.${currency}`, { defaultValue: currency }) : undefined}
          onPress={() => router.push('/settings/currency')}
        />
        <MenuRow
          icon="moon"
          title={t('menuHome.screen.theme')}
          value={t(`settings.themeModes.${themeMode}`)}
          onPress={() => router.push('/settings/theme')}
        />
      </MenuGroup>

      <MenuGroup label={t('menuHome.screen.account')}>
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

      {__DEV__ ? (
        <Button
          label={t('uikit.openCatalog')}
          variant="ghost"
          onPress={() => router.push('/uikit')}
        />
      ) : null}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingHorizontal: theme.space[5], paddingTop: 0, paddingBottom: theme.space[10] },
  delete: {
    marginTop: theme.space[4.5],
    height: theme.sizing.control.md,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space[4],
  },
  pressed: { opacity: 0.6 },
}));
