/** The language of messages; the design has no screen for this choice. */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { useMasterSettingsQuery, useUpdateMasterSettings } from '@/entities/master';
import { useUserId } from '@/entities/session';
import { SelectionMark, SheetHeader, Text, showFailedToast } from '@/shared/ui';

const OPTIONS = ['auto', 'ru', 'en', 'fr'] as const;

export function MessageLanguageSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const userId = useUserId() ?? '';
  const settings = useMasterSettingsQuery(userId);
  const update = useUpdateMasterSettings(userId);
  const current = settings.data?.message_language ?? 'auto';

  const pick = (message_language: (typeof OPTIONS)[number]) => {
    update.mutate({ message_language }, { onError: () => showFailedToast() });
    router.back();
  };

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <SheetHeader
        title={t('menuHome.messages.language')}
        leadingLabel={t('common.close')}
        onLeadingPress={() => router.back()}
        inset={false}
      />
      <View accessibilityRole="radiogroup" style={styles.list}>
        {OPTIONS.map((option, index) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: option === current }}
            onPress={() => pick(option)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.separator,
              pressed && styles.pressed,
            ]}>
            <Text variant="calloutMedium" style={styles.name}>
              {t(`menuHome.messages.languages.${option}`)}
            </Text>
            <SelectionMark checked={option === current} shape="circle" />
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
