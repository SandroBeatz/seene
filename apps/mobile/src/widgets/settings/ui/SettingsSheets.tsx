/** The settings pickers: each shows the current value and saves a pick on the account. */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import {
  parseStoredSchedule,
  useMasterProfileQuery,
  useMasterSettingsQuery,
  useUpdateMasterSettings,
  useUpdateMasterTimezone,
} from '@/entities/master';
import { useUserId } from '@/entities/session';
import { LanguageSheet } from '@/features/language-select';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { type ThemeMode, useThemeStore } from '@/shared/theme/theme.store';
import {
  CurrencySheet,
  SelectionMark,
  SheetHeader,
  Text,
  TimezoneSheet,
} from '@/shared/ui';

const THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark'];

function useSaveFailedAlert() {
  const { t } = useTranslation();
  return () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));
}

export function SettingsLanguageSheet() {
  const router = useRouter();
  const update = useUpdateMasterSettings(useUserId() ?? '');
  const failed = useSaveFailedAlert();
  return (
    <LanguageSheet
      onClose={() => router.back()}
      onPick={(language) => update.mutate({ language }, { onError: failed })}
    />
  );
}

export function SettingsCurrencySheet() {
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useUserId() ?? '';
  const settings = useMasterSettingsQuery(userId);
  const update = useUpdateMasterSettings(userId);
  const failed = useSaveFailedAlert();
  return (
    <CurrencySheet
      value={settings.data?.currency ?? ''}
      onChange={(currency) => update.mutate({ currency }, { onError: failed })}
      hint={t('menuHome.screen.currencyHint')}
      onClose={() => router.back()}
    />
  );
}

export function SettingsTimezoneSheet() {
  const router = useRouter();
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  const update = useUpdateMasterTimezone(userId);
  const failed = useSaveFailedAlert();
  return (
    <TimezoneSheet
      value={parseStoredSchedule(profile.data?.schedule)?.timezone ?? deviceTimeZone()}
      onChange={(timezone) => update.mutate(timezone, { onError: failed })}
      onClose={() => router.back()}
    />
  );
}

export function SettingsThemeSheet() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const update = useUpdateMasterSettings(useUserId() ?? '');
  const failed = useSaveFailedAlert();

  const pick = (next: ThemeMode) => {
    setMode(next);
    update.mutate({ theme: next }, { onError: failed });
    router.back();
  };

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <SheetHeader
        title={t('menuHome.screen.theme')}
        leadingLabel={t('common.close')}
        onLeadingPress={() => router.back()}
        inset={false}
      />
      <View accessibilityRole="radiogroup" style={styles.list}>
        {THEME_MODES.map((item, index) => (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ checked: item === mode }}
            onPress={() => pick(item)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.separator,
              pressed && styles.pressed,
            ]}>
            <Text variant="calloutMedium" style={styles.name}>
              {t(`settings.themeModes.${item}`)}
            </Text>
            <SelectionMark checked={item === mode} shape="circle" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  sheet: {
    backgroundColor: theme.colors.bg.canvas,
    paddingHorizontal: theme.layout.gutter,
    gap: theme.space[1.5],
  },
  list: { marginTop: theme.space[2] },
  row: {
    minHeight: theme.sizing.row.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  separator: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  name: { flex: 1 },
  pressed: { opacity: 0.6 },
}));
