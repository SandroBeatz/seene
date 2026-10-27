/**
 * Content of the native language form sheet (design: Welcome → "Язык"). A radio
 * list of the app languages: each row shows the language in its own name, with
 * the name in the current UI language below. Picking applies at once (persisted
 * in the locale store) and closes the sheet.
 *
 * The sheet sizes to its content (`fitToContents`), so nothing here uses flex: 1.
 */
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import {
  type AppLocale,
  isSupportedLocale,
  LOCALE_NATIVE_NAMES,
  useLocaleStore,
} from '@/shared/lib/i18n';
import { space } from '@/shared/theme/tokens';
import { SelectionMark, SheetHeader, Text } from '@/shared/ui';

/** Display order from the design. */
const LANGUAGES: readonly AppLocale[] = ['ru', 'en', 'fr'];
/** Design: 30pt under the hint (or the home-indicator inset, if larger). */
const SHEET_BOTTOM_GAP = space[7.5];

export interface LanguageSheetProps {
  onClose: () => void;
}

export function LanguageSheet({ onClose }: LanguageSheetProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const setLocale = useLocaleStore((state) => state.setLocale);
  const current = isSupportedLocale(i18n.language) ? i18n.language : 'en';

  function pick(locale: AppLocale) {
    setLocale(locale);
    onClose();
  }

  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SHEET_BOTTOM_GAP) }]}>
      <SheetHeader
        title={t('language.title')}
        leadingLabel={t('common.close')}
        onLeadingPress={onClose}
        inset={false}
      />
      <View accessibilityRole="radiogroup" style={styles.list}>
        {LANGUAGES.map((locale, index) => {
          const checked = locale === current;
          return (
            <Pressable
              key={locale}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              onPress={() => pick(locale)}
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.separator,
                pressed && styles.pressed,
              ]}>
              <View style={styles.names}>
                <Text variant="calloutStrong">{LOCALE_NATIVE_NAMES[locale]}</Text>
                <Text variant="caption" color="secondary">
                  {t(`language.names.${locale}`)}
                </Text>
              </View>
              <SelectionMark checked={checked} shape="circle" />
            </Pressable>
          );
        })}
      </View>
      <Text variant="caption" color="secondary" style={styles.hint}>
        {t('language.hint')}
      </Text>
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
  names: { flex: 1, gap: theme.space[0.25] },
  hint: { marginTop: theme.space[1] },
  pressed: { opacity: 0.6 },
}));
