/**
 * Currency sheet (design: "Валюта"): the design's six currencies (plus the phone's,
 * if it is another) as radio rows with a round glyph badge. Full height, like the
 * time zone sheet: the hint and "Готово" stay pinned to the bottom.
 * Picking applies at once. Used by onboarding and the settings screen.
 */
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { currencyOptions, deviceCurrency } from '@/shared/config/currencies';
import { Button } from '@/shared/ui/Button';
import { FormScreen } from '@/shared/ui/FormScreen';
import { SelectionMark } from '@/shared/ui/SelectionMark';
import { SheetHeader } from '@/shared/ui/SheetHeader';
import { Text } from '@/shared/ui/Text';

export interface CurrencySheetProps {
  value: string;
  onChange: (currency: string) => void;
  hint: string;
  onClose: () => void;
}

export function CurrencySheet({ value, onChange, hint, onClose }: CurrencySheetProps) {
  const { t } = useTranslation();
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
            {hint}
          </Text>
          <Button label={t('onboarding.currencySheet.done')} onPress={onClose} />
        </View>
      }>
      <View accessibilityRole="radiogroup">
        {options.map((option, index) => {
          const on = option.code === value;
          const name = t(`currencies.${option.code}`, { defaultValue: option.code });
          return (
            <Pressable
              key={option.code}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${name}, ${option.code}`}
              onPress={() => onChange(option.code)}
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
