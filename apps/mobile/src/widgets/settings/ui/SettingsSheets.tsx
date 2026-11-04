/** The settings pickers: each shows the current value and saves a pick on the account. */
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import {
  parseStoredSchedule,
  useMasterProfileQuery,
  useMasterSettingsQuery,
  useUpdateMasterSettings,
  useUpdateMasterTimezone,
} from '@/entities/master';
import { useEnsureSystemPaymentTypesMutation, usePaymentTypesQuery } from '@/entities/payment-type';
import { useUserId } from '@/entities/session';
import { LanguageSheet } from '@/features/language-select';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { type ThemeMode, useThemeStore } from '@/shared/theme/theme.store';
import {
  CurrencySheet,
  GroupedCard,
  ListItem,
  SelectionMark,
  SheetChrome,
  SheetHeader,
  Text,
  TimezoneSheet,
  showFailedToast,
} from '@/shared/ui';

const THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark'];

const failed = () => showFailedToast();

export function SettingsLanguageSheet() {
  const router = useRouter();
  const update = useUpdateMasterSettings(useUserId() ?? '');
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
  autoPaymentRoot: { flex: 1 },
  autoPayment: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[2],
    paddingBottom: theme.space[6],
  },
  autoPaymentHint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
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

/** "Способ оплаты" for visits that complete by themselves. */
export function SettingsAutoPaymentSheet() {
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useUserId() ?? '';
  const settings = useMasterSettingsQuery(userId);
  const update = useUpdateMasterSettings(userId);
  const methods = usePaymentTypesQuery(userId).data ?? [];
  const seed = useEnsureSystemPaymentTypesMutation(userId);

  // A master who never opened payment settings has no methods yet: seed cash and card.
  const { mutate: seedMethods } = seed;
  const empty = methods.length === 0;
  useEffect(() => {
    if (empty) seedMethods();
  }, [empty, seedMethods]);

  const active = methods.filter((method) => method.is_active);
  const chosen = settings.data?.auto_complete_payment_type_id ?? null;

  return (
    <View style={styles.autoPaymentRoot} collapsable={false}>
      <SheetChrome title={t('menuHome.screen.autoPayment')} leadingLabel={t('common.close')} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.autoPayment}
        showsVerticalScrollIndicator={false}>
        <GroupedCard>
          {active.map((method) => (
            <ListItem
              key={method.id}
              inset={false}
              title={method.kind === 'custom' ? method.name : t(`checkout.methods.${method.kind}`)}
              showChevron={false}
              right={<SelectionMark checked={method.id === chosen} />}
              onPress={() =>
                update.mutate(
                  { auto_complete_payment_type_id: method.id },
                  { onSuccess: () => router.back(), onError: failed },
                )
              }
            />
          ))}
        </GroupedCard>
        <Text variant="caption" color="tertiary" style={styles.autoPaymentHint}>
          {t('menuHome.screen.autoPaymentHint')}
        </Text>
      </ScrollView>
    </View>
  );
}
