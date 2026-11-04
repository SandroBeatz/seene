/**
 * "Направления и категории" (no board in the design). The master's directions with
 * their categories: hold to reorder, tap to rename or delete, add new ones. Adding a
 * direction opens the profile's specialization sheet: the list is closed, 14 keys.
 */
import { router } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { useMasterProfileQuery } from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import {
  useReorderServiceCategoriesMutation,
  useServiceCategoriesQuery,
  type ServiceCategory,
} from '@/entities/service-category';
import { useUserId } from '@/entities/session';
import { GroupedCard, Icon, MenuGroup, MenuRow, Text, showFailedToast } from '@/shared/ui';
import { byOrder, directionOrder, withGroupOrder } from '../lib/grouping';
import { DirectionHeading } from './DirectionHeading';
import { ReorderCard } from './ReorderCard';

const openCategory = (category: { id: string }) =>
  router.push({ pathname: '/service-category', params: { id: category.id } });

export function ServiceDirectionsScreen() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  const categories = useServiceCategoriesQuery(userId);
  const services = useServicesQuery(userId);
  const reorder = useReorderServiceCategoriesMutation(userId);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const usage = new Map<string, number>();
  for (const service of services.data ?? []) {
    if (service.is_active && service.category_id) {
      usage.set(service.category_id, (usage.get(service.category_id) ?? 0) + 1);
    }
  }
  const usageKey = [...usage].join();

  const renderRow = useCallback(
    (category: ServiceCategory) => (
      <View style={styles.row}>
        <Text variant="body" numberOfLines={1} style={styles.rowName}>
          {category.name}
        </Text>
        <Text variant="footnote" color="tertiary" tabularNums>
          {usage.get(category.id) ?? 0}
        </Text>
        <Icon name="chevronRight" size={16} color="content.tertiary" />
      </View>
    ),
    // `usage` is rebuilt each render; its content is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usageKey],
  );

  const sorted = [...(categories.data ?? [])].sort(byOrder);
  const saveOrder = (ids: string[]) =>
    reorder.mutate(
      withGroupOrder(
        sorted.map((c) => c.id),
        ids,
      ),
      {
        onError: () => showFailedToast(),
      },
    );

  const addRow = (specialization: string) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/service-category', params: { specialization } })}
      style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
      <Icon name="add" size={18} color="content.secondary" />
      <Text variant="body" color="secondary">
        {t('menuHome.servicesPage.addCategoryRow')}
      </Text>
    </Pressable>
  );

  const shared = sorted.filter((c) => c.specialization === null);
  // A direction taken off the profile keeps showing while it has categories to manage.
  const directions = directionOrder(profile.data?.specializations ?? [], sorted);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.root}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {directions.map((key) => {
        const own = sorted.filter((c) => c.specialization === key);
        return (
          <View key={key}>
            <DirectionHeading specialization={key} name={t(`onboarding.specializations.${key}`)} />
            <View style={styles.card}>
              {own.length ? (
                <ReorderCard
                  items={own}
                  scrollableRef={scrollRef}
                  renderRow={renderRow}
                  onPress={openCategory}
                  onReorder={saveOrder}
                  footer={<View style={styles.footerLine}>{addRow(key)}</View>}
                />
              ) : (
                <GroupedCard variant="menu">{addRow(key)}</GroupedCard>
              )}
            </View>
          </View>
        );
      })}

      {shared.length ? (
        <View>
          <DirectionHeading specialization={null} name={t('menuHome.servicesPage.shared')} />
          <View style={styles.card}>
            <ReorderCard
              items={shared}
              scrollableRef={scrollRef}
              renderRow={renderRow}
              onPress={openCategory}
              onReorder={saveOrder}
            />
          </View>
        </View>
      ) : null}

      <MenuGroup>
        <MenuRow
          icon="add"
          title={t('menuHome.servicesPage.addDirectionRow')}
          onPress={() => router.push('/settings/specializations')}
        />
      </MenuGroup>
      <Text variant="caption" color="tertiary" style={styles.hint}>
        {t('menuHome.servicesPage.directionsHint')}
      </Text>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.space[8],
  },
  card: { marginTop: theme.space[2.5] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    minHeight: theme.sizing.row.menu,
  },
  rowName: { flex: 1, minWidth: 0 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    minHeight: theme.sizing.row.menu,
  },
  footerLine: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
  pressed: { opacity: 0.6 },
}));
