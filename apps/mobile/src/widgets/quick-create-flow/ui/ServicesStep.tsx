/**
 * "Новая запись · 2 из 4: услуги" (design "AppNewServices"): search, the directions as
 * chips with their colour, category tabs inside one direction, and the price list
 * grouped by direction and category; a card toggles a service. The bar sums them up.
 */
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  categoriesOf,
  directions,
  groupServices,
  OTHER_DIRECTION,
} from '@/features/appointment-actions';
import {
  DEFAULT_SERVICE_COLOR,
  SERVICE_COLORS,
  SPECIALIZATION_COLORS,
} from '@/shared/config/palettes';
import { isSpecializationKey } from '@/shared/config/specializations';
import { formatDurationLabel, pluralCategory } from '@/shared/lib/i18n';
import { Icon, SearchField, Skeleton, Text } from '@/shared/ui';
import { useFlowData } from '../model/useFlowData';
import { StepChrome } from './StepChrome';
import { StepFooter } from './StepFooter';

const directionColor = (direction: string) =>
  isSpecializationKey(direction)
    ? SERVICE_COLORS[SPECIALIZATION_COLORS[direction]]
    : DEFAULT_SERVICE_COLOR;

export function ServicesStep() {
  const flow = useFlowData();
  const { t, locale, draft } = flow;
  const { theme } = useUnistyles();
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState('all');
  const [category, setCategory] = useState('all');

  const selected = useMemo(() => new Set(draft.serviceIds), [draft.serviceIds]);
  const active = useMemo(() => flow.services.filter((s) => s.is_active), [flow.services]);
  const allDirections = useMemo(() => directions(active), [active]);
  const categories = direction === 'all' ? [] : categoriesOf(active, direction);
  const groups = groupServices(flow.services, selected, { direction, category, query });

  const directionLabel = (key: string) =>
    key === OTHER_DIRECTION ? t('servicesSheet.other') : t(`onboarding.specializations.${key}`);

  const count = flow.picked.length;
  const footerTitle = count
    ? `${t(`servicesSheet.count_${pluralCategory(count, locale)}`, { count })} · ${flow.money(flow.listPrice)}`
    : t('quickCreate.services.none');
  const footerSubtitle = count
    ? `${formatDurationLabel(flow.duration, t)} · ${flow.picked.map((s) => s.name).join(', ')}`
    : t('quickCreate.services.hint');

  return (
    <View style={styles.root} collapsable={false}>
      <StepChrome step={2} subtitle={t('quickCreate.services.subtitle')} client={flow.client} />

      <View style={styles.search}>
        <SearchField
          accessibilityLabel={t('servicesSheet.search')}
          placeholder={t('servicesSheet.search')}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {flow.isPending ? (
        <View style={styles.skeleton}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={64} radius={16} />
          ))}
        </View>
      ) : (
        <>
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
                          {
                            backgroundColor: on
                              ? theme.colors.accent.onAccent
                              : directionColor(key),
                          },
                        ]}
                      />
                    )}
                    <Text variant="bodyStrong" color={on ? 'onAccent' : 'primary'}>
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
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            {groups.length === 0 ? (
              <Text variant="footnote" color="tertiary" align="center" style={styles.empty}>
                {flow.services.length
                  ? t('servicesSheet.nothing')
                  : t('quickCreate.services.empty')}
              </Text>
            ) : null}
            {groups.map((group) => (
              <View key={`${group.direction}-${group.category ?? ''}`}>
                {group.directionHeader ? (
                  <View style={styles.directionHeader}>
                    <View
                      style={[
                        styles.dotLarge,
                        { backgroundColor: directionColor(group.direction) },
                      ]}
                    />
                    <Text variant="headline">{directionLabel(group.direction)}</Text>
                  </View>
                ) : null}
                {group.categoryCaption ? (
                  <Text variant="footnote" color="tertiary" style={styles.caption}>
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
                      onPress={() => draft.toggleService(service.id)}
                      style={[styles.service, on && styles.serviceOn]}>
                      <View style={styles.grow}>
                        <Text variant="bodyMedium">{service.name}</Text>
                        <Text variant="footnote" color="tertiary" tabularNums>
                          {`${formatDurationLabel(service.duration, t)} · ${flow.money(service.price)}`}
                        </Text>
                      </View>
                      <View style={[styles.toggle, on && styles.toggleOn]}>
                        <Icon
                          name={on ? 'check' : 'add'}
                          size="sm"
                          color={on ? 'accent.onAccent' : 'content.primary'}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <StepFooter
        title={footerTitle}
        subtitle={footerSubtitle}
        actionLabel={t('quickCreate.next')}
        disabled={count === 0}
        onAction={() => router.push('/quick-create/date-time')}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  search: { paddingTop: theme.space[3.5], paddingHorizontal: theme.space[4] },
  skeleton: { padding: theme.space[4], gap: theme.space[2] },
  chipsScroll: { flexGrow: 0 },
  chips: {
    gap: theme.space[2],
    paddingTop: theme.space[2.5],
    paddingBottom: 2,
    paddingHorizontal: theme.space[4],
  },
  chip: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    paddingHorizontal: theme.space[3.5],
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  chipOn: {
    backgroundColor: theme.colors.accent.default,
    borderColor: theme.colors.accent.default,
  },
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
  listContent: { paddingHorizontal: theme.space[4], paddingBottom: 140 },
  empty: { marginTop: theme.space[8] },
  directionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2.5],
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
}));
