/** "Услуги и цены" (design AppSvcList): filter by direction, groups, hold to reorder. */
import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useMasterProfileQuery, useMoneyContext } from '@/entities/master';
import {
  useReorderServicesMutation,
  useServicesQuery,
  type ServiceWithCategory,
} from '@/entities/service';
import { useServiceCategoriesQuery } from '@/entities/service-category';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { formatDurationLabel } from '@/shared/lib/i18n';
import {
  Chip,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  MenuGroup,
  MenuRow,
  SkeletonList,
  Text,
} from '@/shared/ui';
import { groupServices, withGroupOrder, type DirectionGroup } from '../lib/grouping';
import { ChipRow } from './ChipRow';
import { DirectionHeading } from './DirectionHeading';
import { ReorderCard } from './ReorderCard';

const openService = (service: { id: string }) =>
  router.push({ pathname: '/service/[serviceId]', params: { serviceId: service.id } });
const openNew = () => router.push('/service/new');

function AddButton() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  if (process.env.EXPO_OS === 'ios') {
    return (
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="plus"
          variant="prominent"
          tintColor={theme.colors.content.primary}
          accessibilityLabel={t('menuHome.servicesPage.addA11y')}
          onPress={openNew}
        />
      </Stack.Toolbar>
    );
  }
  return (
    <Stack.Screen
      options={{
        headerRight: () => (
          <IconButton
            icon="add"
            variant="accent"
            accessibilityLabel={t('menuHome.servicesPage.addA11y')}
            onPress={openNew}
          />
        ),
      }}
    />
  );
}

export function ServiceList() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const services = useServicesQuery(userId);
  const categories = useServiceCategoriesQuery(userId);
  const profile = useMasterProfileQuery(userId);
  const reorder = useReorderServicesMutation(userId);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const [filter, setFilter] = useState<string | null | 'all'>('all');

  const groups = groupServices(
    services.data ?? [],
    categories.data ?? [],
    profile.data?.specializations ?? [],
  );
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  const visible = filter === 'all' ? groups : groups.filter((g) => g.specialization === filter);
  // The filter's direction lost its last service: back to everything.
  const shown = visible.length ? visible : groups;

  const directionName = (key: string | null) =>
    key ? t(`onboarding.specializations.${key}`) : t('menuHome.servicesPage.noDirection');
  const directionsCount = (profile.data?.specializations ?? []).length;

  const saveOrder = (ids: string[]) => {
    const listed = groups.flatMap((group) =>
      group.categories.flatMap(({ services: rows }) => rows.map((service) => service.id)),
    );
    reorder.mutate(withGroupOrder(listed, ids), {
      onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
    });
  };

  if (services.isError) {
    return (
      <ErrorState
        message={t(errorMessageKey(normalizeError(services.error)))}
        onRetry={() => void services.refetch()}
      />
    );
  }

  return (
    <>
      <AddButton />
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.root}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {services.isPending ? (
          <SkeletonList rows={5} />
        ) : total === 0 ? (
          <EmptyState
            icon="tag"
            title={t('menuHome.servicesPage.emptyTitle')}
            description={t('menuHome.servicesPage.emptyText')}
          />
        ) : (
          <>
            <ChipRow>
              <Chip
                size="filter"
                shape="pill"
                label={t('menuHome.servicesPage.all', { count: total })}
                selected={shown === groups}
                onPress={() => setFilter('all')}
              />
              {groups.map((group) => (
                <Chip
                  key={group.specialization ?? 'none'}
                  size="filter"
                  shape="pill"
                  label={`${directionName(group.specialization)} ${group.count}`}
                  selected={shown !== groups && shown[0] === group}
                  onPress={() => setFilter(group.specialization)}
                />
              ))}
            </ChipRow>
            {shown.map((group) => (
              <Direction
                key={group.specialization ?? 'none'}
                group={group}
                name={directionName(group.specialization)}
                scrollRef={scrollRef}
                userId={userId}
                onReorder={saveOrder}
              />
            ))}
          </>
        )}

        <MenuGroup>
          <MenuRow
            icon="tag"
            title={t('menuHome.servicesPage.directions')}
            value={t('menuHome.servicesPage.directionsValue', {
              directions: directionsCount,
              categories: categories.data?.length ?? 0,
            })}
            onPress={() => router.push('/settings/service-directions')}
          />
        </MenuGroup>
        {total > 0 ? (
          <Text variant="caption" color="tertiary" style={styles.hint}>
            {t('menuHome.servicesPage.orderHint')}
          </Text>
        ) : null}
      </Animated.ScrollView>
    </>
  );
}

function Direction({
  group,
  name,
  scrollRef,
  userId,
  onReorder,
}: {
  group: DirectionGroup<ServiceWithCategory>;
  name: string;
  scrollRef: ReturnType<typeof useAnimatedRef<Animated.ScrollView>>;
  userId: string;
  onReorder: (ids: string[]) => void;
}) {
  const { t, i18n } = useTranslation();
  const { money } = useMoneyContext(userId);

  const priceLabel = useCallback(
    (service: ServiceWithCategory) => {
      if (!service.price) {
        return service.show_online
          ? t('menuHome.servicesPage.free')
          : t('menuHome.servicesPage.addPrice');
      }
      const price = money(service.price);
      return service.price_from ? t('menuHome.servicesPage.priceFrom', { price }) : price;
    },
    [money, t],
  );

  const renderRow = useCallback(
    (service: ServiceWithCategory) => (
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text variant="body" numberOfLines={1}>
            {service.name}
          </Text>
          <Text variant="caption" color="tertiary" tabularNums>
            {formatDurationLabel(service.duration, t)}
          </Text>
        </View>
        <Text variant="subheadStrong" tabularNums>
          {priceLabel(service)}
        </Text>
        <Icon name="chevronRight" size={16} color="content.tertiary" />
      </View>
    ),
    // `i18n.language`: the duration label reads it through `t`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [priceLabel, t, i18n.language],
  );

  // A caption only when there is something to tell apart.
  const captions = group.categories.length > 1 || group.categories[0]?.category !== null;

  return (
    <View>
      <DirectionHeading specialization={group.specialization} name={name} />
      {group.categories.map(({ category, services }) => (
        <View key={category?.id ?? 'none'}>
          {captions ? (
            <Text variant="captionStrong" color="secondary" style={styles.caption}>
              {category?.name ?? t('services.uncategorised')}
            </Text>
          ) : (
            <View style={styles.noCaption} />
          )}
          <ReorderCard
            items={services}
            scrollableRef={scrollRef}
            renderRow={renderRow}
            onPress={openService}
            onReorder={onReorder}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[2],
    paddingBottom: theme.space[8],
  },
  caption: { marginTop: theme.space[3.5], marginBottom: theme.space[2], marginHorizontal: theme.space[1] },
  noCaption: { height: theme.space[2.5] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    minHeight: theme.sizing.row.lg,
    paddingVertical: theme.space[2],
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
}));
