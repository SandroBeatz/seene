/**
 * Time zone sheet (design: "Часовой пояс"): search, then the zone detected from the
 * phone, the other zones of the phone's country when it has several (Canada, US,
 * Russia), and the rest. Picking applies at once; "Готово" closes.
 */
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import {
  TIME_ZONES,
  type TimeZoneEntry,
  timeZoneEntry,
  zoneOffsetLabel,
  zoneOffsetMinutes,
} from '@/shared/config/time-zones';
import { type AppLocale, isSupportedLocale } from '@/shared/lib/i18n';
import {
  Button,
  FormScreen,
  SearchField,
  SectionLabel,
  SelectionMark,
  SheetHeader,
  Text,
} from '@/shared/ui';
import { deviceTimeZone } from '../model/device';
import { useOnboardingDraft } from '../model/draft.store';

interface Group {
  title: string;
  zones: TimeZoneEntry[];
}

function buildGroups(locale: AppLocale, countryTitle: (code: string) => string | null): Group[] {
  const device = timeZoneEntry(deviceTimeZone());
  const country = device.country
    ? TIME_ZONES.filter((z) => z.country === device.country && z.id !== device.id)
    : [];
  const countryLabel = country.length ? countryTitle(device.country) : null;
  const taken = new Set([device.id, ...(countryLabel ? country.map((z) => z.id) : [])]);
  return [
    { title: 'detected', zones: [device] },
    ...(countryLabel ? [{ title: countryLabel, zones: country }] : []),
    { title: 'others', zones: TIME_ZONES.filter((z) => !taken.has(z.id)) },
  ].map((g) => ({ ...g, zones: g.zones.slice().sort(byOffset) })) as Group[];

  function byOffset(a: TimeZoneEntry, b: TimeZoneEntry) {
    return zoneOffsetMinutes(b.id) - zoneOffsetMinutes(a.id) || a.name[locale].localeCompare(b.name[locale]);
  }
}

export interface TimezoneSheetProps {
  onClose: () => void;
}

export function TimezoneSheet({ onClose }: TimezoneSheetProps) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const timezone = useOnboardingDraft((state) => state.timezone);
  const setSettings = useOnboardingDraft((state) => state.setSettings);
  const [query, setQuery] = useState('');

  const groups = useMemo(
    () =>
      buildGroups(locale, (code) =>
        t(`onboarding.timezoneSheet.countries.${code}`, { defaultValue: '' }) || null,
      ),
    [locale, t],
  );

  const q = query.trim().toLowerCase();
  const visible = groups
    .map((group) => ({
      ...group,
      zones: group.zones.filter((zone) => {
        if (!q) return true;
        const hay = [zone.name[locale], zone.place[locale], zoneOffsetLabel(zone.id), zone.id]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      }),
    }))
    .filter((group) => group.zones.length > 0);

  const title = (group: Group) =>
    group.title === 'detected'
      ? t('onboarding.timezoneSheet.detected')
      : group.title === 'others'
        ? t('onboarding.timezoneSheet.others')
        : group.title;

  return (
    <FormScreen
      edges={['bottom']}
      padded={false}
      contentContainerStyle={styles.body}
      header={
        <View>
          <SheetHeader
            title={t('onboarding.timezoneSheet.title')}
            leadingLabel={t('common.close')}
            onLeadingPress={onClose}
          />
          <View style={styles.search}>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder={t('onboarding.timezoneSheet.search')}
              accessibilityLabel={t('onboarding.timezoneSheet.searchA11y')}
            />
          </View>
        </View>
      }
      footerDivider
      footer={
        <View style={styles.footer}>
          <Text variant="footnote" color="secondary">
            {t('onboarding.timezoneSheet.hint')}
          </Text>
          <Button label={t('onboarding.timezoneSheet.done')} onPress={onClose} />
        </View>
      }>
      {visible.map((group) => (
        <View key={group.title} style={styles.group} accessibilityRole="radiogroup">
          <View style={styles.groupLabel}>
            <SectionLabel label={title(group)} />
          </View>
          {group.zones.map((zone) => {
            const on = zone.id === timezone;
            const offset = zoneOffsetLabel(zone.id);
            const place = zone.place[locale];
            return (
              <Pressable
                key={`${group.title}-${zone.id}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${zone.name[locale]}, ${offset}`}
                onPress={() => setSettings({ timezone: zone.id })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={styles.rowText}>
                  <Text variant="calloutMedium">{zone.name[locale]}</Text>
                  <Text variant="caption" color="secondary">
                    {place ? `${offset} · ${place}` : offset}
                  </Text>
                </View>
                <SelectionMark checked={on} shape="circle" />
              </Pressable>
            );
          })}
        </View>
      ))}
      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyStrong" align="center">
            {t('onboarding.timezoneSheet.emptyTitle')}
          </Text>
          <Text variant="footnote" color="secondary" align="center">
            {t('onboarding.timezoneSheet.emptyText')}
          </Text>
        </View>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  search: {
    paddingTop: theme.space[3.5],
    paddingBottom: theme.space[1],
    paddingHorizontal: theme.layout.gutter,
  },
  body: { paddingHorizontal: theme.layout.gutter },
  group: { marginTop: theme.space[4] },
  groupLabel: { marginBottom: theme.space[0.5] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    minHeight: theme.sizing.row.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  rowText: { flex: 1, minWidth: 0, gap: theme.space[0.25] },
  empty: { paddingVertical: theme.space[9], paddingHorizontal: theme.space[2], gap: theme.space[1.5] },
  footer: { gap: theme.space[2.5] },
  pressed: { opacity: 0.7 },
}));
