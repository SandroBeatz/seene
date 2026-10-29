/**
 * Currency sheet (design: "Валюта"): the design's six currencies (plus the phone's,
 * if it is another) as radio rows with a round glyph badge. Full height, like the
 * time zone sheet: the hint and "Готово" stay pinned to the bottom.
 * Picking applies at once — step-4 prices re-render in the new currency.
 */
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { currencyOptions } from '@/shared/config/currencies';
import { Button, FormScreen, SelectionMark, SheetHeader, Text } from '@/shared/ui';
import { deviceCurrency } from '../model/device';
import { useOnboardingDraft } from '../model/draft.store';

export interface CurrencySheetProps {
  onClose: () => void;
}

export function CurrencySheet({ onClose }: CurrencySheetProps) {
  const { t } = useTranslation();
  const currency = useOnboardingDraft((state) => state.currency);
  const setSettings = useOnboardingDraft((state) => state.setSettings);
  const options = currencyOptions(deviceCurrency());

  return (
    <FormScreen
      edges={['bottom']}
      padded={false}
      contentContainerStyle={styles.body}
      header={
        <SheetHeader
          title={t('onboarding.currencySheet.title')}
          leadingLabel={t('common.close')}
          onLeadingPress={onClose}
        />
      }
      footer={
        <View style={styles.footer}>
          <Text variant="footnote" color="secondary">
            {t('onboarding.currencySheet.hint')}
          </Text>
          <Button label={t('onboarding.currencySheet.done')} onPress={onClose} />
        </View>
      }>
      <View accessibilityRole="radiogroup">
        {options.map((option, index) => {
          const on = option.code === currency;
          const name = t(`currencies.${option.code}`, { defaultValue: option.code });
          return (
            <Pressable
              key={option.code}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${name}, ${option.code}`}
              onPress={() => setSettings({ currency: option.code })}
              style={({ pressed }) => [styles.row, index > 0 && styles.separator, pressed && styles.pressed]}>
              <View style={styles.badge}>
                <Text variant="headline" style={styles.glyph}>
                  {option.glyph}
                </Text>
              </View>
              <View style={styles.names}>
                <Text variant="calloutMedium">{name}</Text>
                <Text variant="caption" color="secondary">
                  {option.code}
                </Text>
              </View>
              <SelectionMark checked={on} shape="circle" />
            </Pressable>
          );
        })}
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  body: { paddingTop: theme.space[2], paddingHorizontal: theme.layout.gutter },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3], minHeight: theme.sizing.row.lg },
  separator: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  badge: {
    width: theme.sizing.iconButton,
    height: theme.sizing.iconButton,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Inter Tight bold, as the design's currency glyphs.
  glyph: { fontFamily: theme.typography.title3.fontFamily },
  names: { flex: 1, gap: theme.space[0.25] },
  footer: { gap: theme.space[2.5] },
  pressed: { opacity: 0.7 },
}));
