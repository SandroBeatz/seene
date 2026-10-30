/**
 * The phone country picker behind «KG +996 ⌄»: a page sheet with search by name,
 * code or dial code, the chosen country ticked.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { countryName, PHONE_COUNTRIES } from '@/shared/config/countries';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { countryFlag, dialCode, type CountryCode } from '@/shared/lib/phone';
import { Icon, IconButton, SearchField, Text } from '@/shared/ui';

export interface CountrySheetProps {
  visible: boolean;
  value: CountryCode;
  onClose: () => void;
  onPick: (country: CountryCode) => void;
}

export function CountrySheet({ visible, value, onClose, onPick }: CountrySheetProps) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    return PHONE_COUNTRIES.map((entry) => ({
      code: entry.code as CountryCode,
      name: countryName(entry.code, locale),
      dial: dialCode(entry.code as CountryCode),
    }))
      .filter(
        (row) =>
          !q ||
          row.name.toLowerCase().includes(q) ||
          row.code.toLowerCase() === q ||
          row.dial.slice(1).startsWith(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [query, locale]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onDismiss={() => setQuery('')}>
      <View style={styles.root}>
        <View style={styles.header}>
          <IconButton
            icon="close"
            variant="neutral"
            accessibilityLabel={t('clients.form.close')}
            onPress={onClose}
          />
          <Text variant="calloutStrong" align="center" style={styles.title}>
            {t('clients.form.countryTitle')}
          </Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.search}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder={t('clients.form.countrySearch')}
            accessibilityLabel={t('clients.form.countrySearch')}
          />
        </View>
        <FlatList
          data={rows}
          keyExtractor={(row) => row.code}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <Text variant="footnote" color="tertiary" style={styles.hint}>
              {t('clients.form.countryHint')}
            </Text>
          }
          renderItem={({ item }) => {
            const on = item.code === value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  onPick(item.code);
                  onClose();
                }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Text variant="bodyLarge">{countryFlag(item.code)}</Text>
                <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
                  {item.name}
                </Text>
                <Text variant="body" color="secondary" tabularNums>
                  {item.dial}
                </Text>
                <View style={styles.check}>
                  {on ? <Icon name="check" size="sm" color="content.primary" /> : null}
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
  },
  title: { flex: 1 },
  spacer: { width: theme.sizing.iconButton },
  search: { paddingTop: theme.space[3], paddingHorizontal: theme.space[4] },
  list: { paddingHorizontal: theme.space[4], paddingTop: theme.space[2], paddingBottom: theme.space[10] },
  row: {
    minHeight: theme.sizing.control.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  pressed: { opacity: 0.7 },
  name: { flex: 1 },
  check: { width: theme.sizing.icon.sm },
  hint: { paddingTop: theme.space[4] },
}));
