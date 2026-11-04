/**
 * The appointment's services (design "Запись · услуги": «Все» — направления, одно
 * направление с категориями): search, direction chips with their colour, category
 * tabs, multi-select, and the visit's duration and price — "Как в прайсе" or set for
 * this appointment only.
 */
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  invalidateAppointmentCaches,
  useUpdateAppointmentMutation,
  type Appointment,
} from '@/entities/appointment';
import { useUpdateFinishedVisitMutation } from '@/entities/sale';
import { useQueryClient } from '@tanstack/react-query';
import { useUserId } from '@/entities/session';
import { saleItems } from '../model/checkout';
import type { ServiceWithCategory } from '@/entities/service';
import { formatAmount } from '@/shared/lib/formats';
import { formatDurationLabel, pluralCategory, type AppLocale } from '@/shared/lib/i18n';
import {
  Button,
  Icon,
  SearchField,
  SheetChrome,
  Text,
  showFailedToast,
  showErrorToast,
} from '@/shared/ui';
import {
  categoriesOf,
  directionColor,
  directions,
  groupServices,
  OTHER_DIRECTION,
  totalsOf,
  VISIT_MIN_MINUTES,
} from '../model/services';
import { useVisitSavedToast } from '../model/useVisitSavedToast';

export interface ServicesEditorProps {
  appointment: Appointment;
  services: ServiceWithCategory[];
  currency: string;
  currencyLabel: string;
  locale: AppLocale;
}

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
  const userId = useUserId() ?? '';
  const qc = useQueryClient();
  const update = useUpdateAppointmentMutation(userId);
  const updateFinished = useUpdateFinishedVisitMutation(userId);
  const showSaved = useVisitSavedToast(appointment);

  const [selected, setSelected] = useState(() => new Set(appointment.service_ids));
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState('all');
  const [category, setCategory] = useState('all');

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

  const directionLabel = (key: string) =>
    key === OTHER_DIRECTION ? t('servicesSheet.other') : t(`onboarding.specializations.${key}`);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const finished = appointment.status === 'completed';
  const pending = update.isPending || updateFinished.isPending;

  const done = () => {
    showSaved();
    router.back();
  };

  const save = () => {
    if (selected.size === 0) return showErrorToast(t('servicesSheet.pickOne'));
    const ids = [...selected];
    const same =
      ids.length === appointment.service_ids.length &&
      ids.every((id) => appointment.service_ids.includes(id));
    if (same) return router.back();
    if (finished) {
      // What was paid and how long it took stay: the chips change those.
      updateFinished.mutate(
        {
          appointmentId: appointment.id,
          serviceIds: ids,
          items: saleItems(ids, services),
        },
        {
          onSuccess: done,
          onError: () => showFailedToast(save),
          onSettled: () => invalidateAppointmentCaches(qc, userId),
        },
      );
    } else {
      update.mutate(
        {
          id: appointment.id,
          service_ids: ids,
          duration: Math.max(totals.listDuration, VISIT_MIN_MINUTES),
          price: null,
        },
        { onSuccess: done, onError: () => showFailedToast(save) },
      );
    }
  };

  return (
    // Kept as a real view: a form sheet (react-native-screens) pins a ScrollView that
    // is a direct child of the screen to the top and stretches it over the header.
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('servicesSheet.title')} leadingLabel={t('common.close')} spacer />

      <View style={styles.search}>
        <SearchField
          accessibilityLabel={t('servicesSheet.search')}
          placeholder={t('servicesSheet.search')}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* One direction: nothing to switch between. */}
      {allDirections.length > 1 ? (
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
      ) : null}

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
                      {`${formatDurationLabel(service.duration, t)} · ${
                        service.price_from
                          ? t('menuHome.servicesPage.priceFrom', {
                              price: formatAmount(service.price, { currency, locale }),
                            })
                          : formatAmount(service.price, { currency, locale })
                      }`}
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
          {selected.size ? (
            <Text variant="footnoteStrong" tabularNums>
              {`${formatDurationLabel(totals.listDuration, t)} · ${formatAmount(totals.listPrice, { currency, locale })}`}
            </Text>
          ) : null}
        </View>
        <Button label={t('common.save')} onPress={save} loading={pending} fullWidth />
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
