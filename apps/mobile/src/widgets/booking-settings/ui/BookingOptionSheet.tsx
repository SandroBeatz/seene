/** Picks one value of a booking rule; the design has no screen for it. A pick saves. */
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { useMasterSettingsQuery, useUpdateMasterSettings } from '@/entities/master';
import { useUserId } from '@/entities/session';
import { SelectionMark, SheetHeader, Text, showFailedToast } from '@/shared/ui';
import {
  BOOKING_OPTIONS,
  isBookingOption,
  optionValue,
  optionValues,
  type BookingOption,
} from '../lib/options';
import { useOptionLabel } from './useOptionLabel';

const TITLE_KEY: Record<BookingOption, string> = {
  notice: 'menuHome.booking.notice',
  horizon: 'menuHome.booking.horizon',
  step: 'menuHome.booking.step',
  buffer: 'menuHome.booking.buffer',
  cancel: 'menuHome.booking.cancel',
};

export function BookingOptionSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { option } = useLocalSearchParams<{ option: string }>();
  const userId = useUserId() ?? '';
  const settings = useMasterSettingsQuery(userId);
  const update = useUpdateMasterSettings(userId);
  const label = useOptionLabel();
  if (!isBookingOption(option) || !settings.data) return null;

  const current = optionValue(settings.data, option);
  const pick = (value: number) => {
    update.mutate(
      { [BOOKING_OPTIONS[option].column]: value },
      { onError: () => showFailedToast() },
    );
    router.back();
  };

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <SheetHeader
        title={t(TITLE_KEY[option])}
        leadingLabel={t('common.close')}
        onLeadingPress={() => router.back()}
        inset={false}
      />
      <View accessibilityRole="radiogroup" style={styles.list}>
        {optionValues(option, current).map((value, index) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === current }}
            onPress={() => pick(value)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.separator,
              pressed && styles.pressed,
            ]}>
            <Text variant="calloutMedium" style={styles.name}>
              {label(option, value)}
            </Text>
            <SelectionMark checked={value === current} shape="circle" />
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
    minHeight: theme.sizing.row.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  separator: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  name: { flex: 1 },
  pressed: { opacity: 0.6 },
}));
