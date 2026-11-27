/**
 * "Настройки" (design "Меню v2 · Настройки"): the app itself — notifications, language
 * and region, theme. The account and auto-complete have their own pages ("Аккаунт",
 * "Завершение визитов").
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import {
  parseStoredSchedule,
  useMasterProfileQuery,
  useMasterSettingsQuery,
} from '@/entities/master';
import { useUserId } from '@/entities/session';
import { zoneOffsetLabel } from '@/shared/config/time-zones';
import { isSupportedLocale, LOCALE_NATIVE_NAMES } from '@/shared/lib/i18n';
import { useThemeStore } from '@/shared/theme/theme.store';
import { Button, MenuGroup, MenuRow, ScreenScrollView } from '@/shared/ui';

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const themeMode = useThemeStore((state) => state.mode);

  const timezone = parseStoredSchedule(profile.data?.schedule)?.timezone;
  const currency = settings.data?.currency;
  const language = isSupportedLocale(i18n.language)
    ? LOCALE_NATIVE_NAMES[i18n.language]
    : undefined;

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <MenuGroup>
        <MenuRow
          icon="bell"
          title={t('notifications.settings.title')}
          onPress={() => router.push('/settings/notifications')}
        />
      </MenuGroup>

      <MenuGroup label={t('menuHome.screen.region')}>
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
      </MenuGroup>

      <MenuGroup label={t('menuHome.screen.look')}>
        <MenuRow
          icon="moon"
          title={t('menuHome.screen.theme')}
          value={t(`settings.themeModes.${themeMode}`)}
          onPress={() => router.push('/settings/theme')}
        />
      </MenuGroup>

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
}));
