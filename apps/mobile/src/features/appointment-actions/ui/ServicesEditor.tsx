/**
 * The appointment's services (design "Запись · услуги": «Все» — направления, одно
 * направление с категориями): search, direction chips with their colour, category
 * tabs, multi-select, and the visit's duration and price — "Как в прайсе" or set for
 * this appointment only.
 */
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useUpdateAppointmentMutation, type Appointment } from '@/entities/appointment';
import { useUserId } from '@/entities/session';
import type { ServiceWithCategory } from '@/entities/service';
import {
  DEFAULT_SERVICE_COLOR,
  SERVICE_COLORS,
  SPECIALIZATION_COLORS,
} from '@/shared/config/palettes';
import { isSpecializationKey } from '@/shared/config/specializations';
import { formatAmount } from '@/shared/lib/formats';
import { formatDurationLabel, pluralCategory, type AppLocale } from '@/shared/lib/i18n';
import { Button, Icon, SearchField, SheetChrome, Text } from '@/shared/ui';
import {
  categoriesOf,
  directions,
  groupServices,
  OTHER_DIRECTION,
  resolveVisit,
  totalsOf,
  VISIT_MAX_MINUTES,
  VISIT_MIN_MINUTES,
} from '../model/services';

export interface ServicesEditorProps {
  appointment: Appointment;
  services: ServiceWithCategory[];
  currency: string;
  currencyLabel: string;
  locale: AppLocale;
}

const directionColor = (direction: string) =>
  isSpecializationKey(direction)
    ? SERVICE_COLORS[SPECIALIZATION_COLORS[direction]]
    : DEFAULT_SERVICE_COLOR;

export function ServicesEditor({
  appointment,
  services,
  currency,
  currencyLabel,
  locale,
}: ServicesEditorProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const update = useUpdateAppointmentMutation(useUserId() ?? '');

  const [selected, setSelected] = useState(() => new Set(appointment.service_ids));
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState('all');
  const [category, setCategory] = useState('all');

  const initialTotals = totalsOf(services, new Set(appointment.service_ids));
  const [durationInput, setDurationInput] = useState<string | null>(
    appointment.duration !== initialTotals.listDuration ? String(appointment.duration) : null,
  );
  const [priceInput, setPriceInput] = useState<string | null>(
    appointment.price !== null ? String(appointment.price) : null,
  );

  const allDirections = useMemo(() => directions(services.filter((s) => s.is_active)), [services]);
  const categories =
    direction === 'all'
      ? []
      : categoriesOf(
          services.filter((s) => s.is_active),
          direction,
        );
  const groups = groupServices(services, selected, { direction, category, query });
  const totals = totalsOf(services, selected);
  const changed = durationInput !== null || priceInput !== null;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  const directionLabel = (key: string) =>
    key === OTHER_DIRECTION ? t('servicesSheet.other') : t(`onboarding.specializations.${key}`);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = () => {
    const visit = resolveVisit(totals, durationInput, priceInput);
    if (selected.size === 0) return Alert.alert(t('servicesSheet.pickOne'));
    if (visit.duration < VISIT_MIN_MINUTES || visit.duration > VISIT_MAX_MINUTES) {
      return Alert.alert(t('servicesSheet.badDuration'));
    }
    update.mutate(
      { id: appointment.id, service_ids: [...selected], ...visit },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
      },
    );
  };

  return (
    // Kept as a real view: a form sheet (react-native-screens) pins a ScrollView that
    // is a direct child of the screen to the top and stretches it over the header.
    <View style={styles.root} collapsable={false}>
      <SheetChrome
        title={t('servicesSheet.title')}
        leading="back"
        leadingLabel={t('servicesSheet.back')}
        spacer
      />

      <View style={styles.search}>
        <SearchField
          accessibilityLabel={t('servicesSheet.search')}
          placeholder={t('servicesSheet.search')}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
        accessibilityRole="tablist">
        {['all', ...allDirections].map((key) => {
          const on = direction === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => {
                setDirection(key);
                setCategory('all');
              }}
              style={[styles.chip, on && styles.chipOn]}>
              {key === 'all' ? null : (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: on ? theme.colors.accent.onAccent : directionColor(key) },
                  ]}
                />
              )}
              <Text variant="footnoteStrong" color={on ? 'onAccent' : 'primary'}>
                {key === 'all' ? t('servicesSheet.all') : directionLabel(key)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {categories.length > 1 && !query.trim() ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabs}>
          {[
            { id: 'all', name: t('servicesSheet.all') },
            ...categories.map((c) => ({
              id: c.id ?? '',
              name: c.name ?? t('servicesSheet.noCategory'),
            })),
          ].map((tab) => {
            const on = category === tab.id;
            return (
              <Pressable
                key={tab.id || 'none'}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setCategory(tab.id)}
                style={[styles.tab, on && styles.tabOn]}>
                <Text
                  variant={on ? 'footnoteStrong' : 'footnote'}
                  color={on ? 'primary' : 'tertiary'}>
                  {tab.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {groups.length === 0 ? (
          <Text variant="footnote" color="tertiary" align="center" style={styles.empty}>
            {t('servicesSheet.nothing')}
          </Text>
        ) : null}
        {groups.map((group) => (
          <View key={`${group.direction}-${group.category ?? ''}`}>
            {group.directionHeader ? (
              <View style={styles.directionHeader}>
                <View
                  style={[styles.dotLarge, { backgroundColor: directionColor(group.direction) }]}
                />
                <Text variant="bodyStrong">{directionLabel(group.direction)}</Text>
              </View>
            ) : null}
            {group.categoryCaption ? (
              <Text variant="captionStrong" color="tertiary" style={styles.caption}>
                {group.category ?? t('servicesSheet.noCategory')}
              </Text>
            ) : null}
            {group.items.map((service) => {
              const on = selected.has(service.id);
              return (
                <Pressable
                  key={service.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => toggle(service.id)}
                  style={[styles.service, on && styles.serviceOn]}>
                  <View style={styles.grow}>
                    <Text variant="bodyMedium">{service.name}</Text>
                    <Text variant="footnote" color="tertiary" tabularNums>
                      {`${formatDurationLabel(service.duration, t)} · ${formatAmount(service.price, { currency, locale })}`}
                    </Text>
                  </View>
                  <View style={[styles.toggle, on && styles.toggleOn]}>
                    <Icon
                      name={on ? 'check' : 'add'}
                      size={14}
                      color={on ? 'accent.onAccent' : 'content.primary'}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.panelHead}>
          <Text variant="footnote" color="secondary">
            {selected.size
              ? t(`servicesSheet.count_${pluralCategory(selected.size, locale)}`, {
                  count: selected.size,
                })
              : t('servicesSheet.pickOne')}
          </Text>
          {changed ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setDurationInput(null);
                setPriceInput(null);
              }}>
              <Text variant="footnoteStrong" color="brand">
                {t('servicesSheet.asListed')}
              </Text>
            </Pressable>
          ) : (
            <Text variant="caption" color="tertiary">
              {t('servicesSheet.canChange')}
            </Text>
          )}
        </View>
        <View style={styles.fields}>
          <View style={styles.field}>
            <Icon name="clock" size="sm" color="content.tertiary" />
            <TextInput
              accessibilityLabel={t('servicesSheet.durationA11y')}
              value={durationInput ?? String(totals.listDuration)}
              onChangeText={setDurationInput}
              keyboardType="number-pad"
              style={styles.input}
            />
            <Text variant="footnote" color="tertiary">
              {t('servicesSheet.minutes')}
            </Text>
          </View>
          <View style={styles.field}>
            <Icon name="tag" size="sm" color="content.tertiary" />
            <TextInput
              accessibilityLabel={t('servicesSheet.priceA11y', { currency: currencyLabel })}
              value={priceInput ?? number.format(totals.listPrice)}
              onChangeText={setPriceInput}
              keyboardType="number-pad"
              style={styles.input}
            />
            <Text variant="footnote" color="tertiary">
              {currencyLabel}
            </Text>
          </View>
        </View>
        <Button label={t('common.save')} onPress={save} loading={update.isPending} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  search: { paddingTop: theme.space[2], paddingHorizontal: theme.space[4] },
  chipsScroll: { flexGrow: 0 },
  chips: {
    gap: theme.space[1.5],
    paddingTop: theme.space[2.5],
    paddingBottom: 2,
    paddingHorizontal: theme.space[4],
  },
  chip: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.5],
    paddingHorizontal: theme.space[3.5],
    borderRadius: 17,
    backgroundColor: theme.colors.bg.surface,
  },
  chipOn: { backgroundColor: theme.colors.accent.default },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotLarge: { width: 8, height: 8, borderRadius: 4 },
  tabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  tabs: { gap: theme.space[4], paddingTop: theme.space[1.5], paddingHorizontal: theme.space[4] },
  tab: { height: 34, justifyContent: 'center' },
  tabOn: { borderBottomWidth: 2, borderBottomColor: theme.colors.accent.default },
  list: { flex: 1 },
  listContent: { paddingHorizontal: theme.space[4], paddingBottom: 240 },
  empty: { marginTop: theme.space[8] },
  directionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    marginTop: theme.space[5],
  },
  caption: { marginTop: theme.space[4] },
  service: {
    marginTop: theme.space[2],
    minHeight: 64,
    paddingVertical: theme.space[2.5],
    paddingLeft: theme.space[3.5],
    paddingRight: theme.space[3],
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  serviceOn: { borderColor: theme.colors.accent.default },
  grow: { flex: 1, minWidth: 0, gap: 2 },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.surface,
  },
  toggleOn: { backgroundColor: theme.colors.accent.default },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    gap: theme.space[2.5],
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg.elevated,
    boxShadow: theme.shadow.panel,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space[2.5],
  },
  fields: { flexDirection: 'row', gap: theme.space[2] },
  field: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    paddingHorizontal: theme.space[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.surface,
  },
  input: {
    flex: 1,
    padding: 0,
    color: theme.colors.content.primary,
    ...theme.typography.bodyStrong,
  },
}));
