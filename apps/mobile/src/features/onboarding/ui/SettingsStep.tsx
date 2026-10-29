/**
 * Step 3 of 4 — "Основное": time zone, currency and working hours prefilled from
 * the phone (each opens its sheet), then the online-booking and manual-confirm
 * switches. Comes before services so prices are typed in the right currency.
 * Everything here lands in the draft; nothing is written until the end.
 */
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { StyleSheet } from 'react-native-unistyles';
import { timeZoneEntry, zoneOffsetLabel } from '@/shared/config/time-zones';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { Button, FormScreen, GroupedCard, ListItem, ScreenTitle, Switch, Text } from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';
import { formatHoursLabel } from '../model/format';
import { hasInvalidRange, workingDayCount } from '../model/hours';
import { useOnboardingHeaderInset } from './OnboardingHeader';

export interface SettingsStepProps {
  onOpenTimezone: () => void;
  onOpenCurrency: () => void;
  onOpenHours: () => void;
  onNext: () => void;
}

export function SettingsStep({
  onOpenTimezone,
  onOpenCurrency,
  onOpenHours,
  onNext,
}: SettingsStepProps) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const headerInset = useOnboardingHeaderInset();
  const { timezone, currency, hours, onlineBooking, manualConfirm, setSettings } =
    useOnboardingDraft(
      useShallow((state) => ({
        timezone: state.timezone,
        currency: state.currency,
        hours: state.hours,
        onlineBooking: state.onlineBooking,
        manualConfirm: state.manualConfirm,
        setSettings: state.setSettings,
      })),
    );

  const zone = timeZoneEntry(timezone);
  const days = workingDayCount(hours);
  const hoursLabel = formatHoursLabel(hours, t, locale);

  return (
    <FormScreen
      edges={['right', 'bottom', 'left']}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingTop: headerInset }}
      footer={
        <Button
          label={t('onboarding.settings.next')}
          disabled={days === 0 || hasInvalidRange(hours)}
          onPress={onNext}
        />
      }>
      <View style={styles.title}>
        <ScreenTitle
          title={t('onboarding.settings.title')}
          subtitle={t('onboarding.settings.subtitle')}
        />
      </View>

      <View style={styles.group}>
        <GroupedCard>
          <ListItem
            title={t('onboarding.settings.timezone')}
            subtitle={t('onboarding.settings.timezoneHint')}
            trailingText={`${zone.name[locale]}, ${zoneOffsetLabel(timezone)}`}
            inset={false}
            onPress={onOpenTimezone}
          />
          <ListItem
            title={t('onboarding.settings.currency')}
            subtitle={t('onboarding.settings.currencyHint')}
            trailingText={`${t(`currencies.${currency}`, { defaultValue: currency })}, ${currency}`}
            inset={false}
            onPress={onOpenCurrency}
          />
          <ListItem
            title={t('onboarding.settings.hours')}
            subtitle={t('onboarding.settings.hoursHint')}
            trailingText={hoursLabel}
            inset={false}
            onPress={onOpenHours}
          />
        </GroupedCard>
      </View>

      <View style={styles.toggles}>
        <GroupedCard>
          <ToggleRow
            label={t('onboarding.settings.online')}
            hint={t('onboarding.settings.onlineHint')}
            value={onlineBooking}
            onChange={(value) => setSettings({ onlineBooking: value })}
          />
          <ToggleRow
            label={t('onboarding.settings.manual')}
            hint={t('onboarding.settings.manualHint')}
            value={manualConfirm}
            onChange={(value) => setSettings({ manualConfirm: value })}
          />
        </GroupedCard>
      </View>
    </FormScreen>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text variant="body">{label}</Text>
        <Text variant="caption" color="secondary">
          {hint}
        </Text>
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: { marginTop: theme.space[7] },
  group: { marginTop: theme.space[5.5] },
  toggles: { marginTop: theme.space[3] },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    minHeight: theme.sizing.row.xl,
    paddingVertical: theme.space[2],
  },
  toggleText: { flex: 1, minWidth: 0, gap: theme.space[0.5] },
}));
