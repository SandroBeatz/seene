/**
 * "Клиенты за период" (design "Клиенты за период"): how many came, came back and are
 * new, then everyone by the sum they paid, with the filter chips.
 */
import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useMoneyClientsQuery } from '@/entities/analytics';
import { useMoneyContext } from '@/entities/master';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { pluralCategory } from '@/shared/lib/i18n';
import {
  Avatar,
  Chip,
  EmptyState,
  ErrorState,
  SkeletonList,
  Text,
  useRefreshControl,
} from '@/shared/ui';
import { usePeriod, usePeriodName } from '../model/usePeriod';

type Filter = 'all' | 'back' | 'new';
const FILTERS: Filter[] = ['all', 'back', 'new'];

export function PeriodClientsScreen() {
  const { t } = useTranslation();
  const { period, range, userId, zone } = usePeriod();
  const ctx = useMoneyContext(userId);
  const periodName = usePeriodName();
  const clients = useMoneyClientsQuery(userId, range.from, range.to);
  const [filter, setFilter] = useState<Filter>('all');
  const refreshControl = useRefreshControl(() => clients.refetch());

  const all = clients.data ?? [];
  const counts: Record<Filter, number> = {
    all: all.length,
    back: all.filter((c) => !c.is_new).length,
    new: all.filter((c) => c.is_new).length,
  };
  const rows = all.filter((c) => filter === 'all' || c.is_new === (filter === 'new'));
  const short = t('monthsShort', { returnObjects: true }) as string[];
  const accusative = t('money.monthsAccusative', { returnObjects: true }) as string[];
  // "Клиенты за октябрь", for any other period its name.
  const titlePeriod =
    period.unit === 'month'
      ? accusative[DateTime.fromISO(period.startKey, { zone: 'utc' }).month - 1]
      : periodName(period);
  const lastLabel = (iso: string) => {
    const date = DateTime.fromISO(iso, { zone });
    return `${date.day} ${short[date.month - 1]}`;
  };

  const header = (
    <View>
      <View style={styles.tiles}>
        {FILTERS.map((item) => (
          <View key={item} style={styles.tile}>
            <Text variant="caption" color="secondary">
              {t(`money.periodClients.tile.${item}`)}
            </Text>
            <Text variant="stat" tabularNums>
              {counts[item]}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.chips}>
        {FILTERS.map((item) => (
          <Chip
            key={item}
            shape="pill"
            label={`${t(`money.periodClients.chip.${item}`)} ${counts[item]}`}
            selected={filter === item}
            onPress={() => setFilter(item)}
          />
        ))}
      </View>
      <View style={styles.meta}>
        <Text variant="caption" color="tertiary">
          {t('money.periodClients.bySum')}
        </Text>
        <Text variant="caption" color="tertiary" tabularNums>
          {t('money.periodClients.shown', { count: rows.length })}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{ title: t('money.periodClients.title', { period: titlePeriod }) }}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={styles.root}
        contentContainerStyle={styles.content}
        data={rows}
        keyExtractor={(row) => row.client_id}
        ListHeaderComponent={header}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          clients.isError ? (
            <ErrorState
              message={t(errorMessageKey(normalizeError(clients.error)))}
              onRetry={() => void clients.refetch()}
            />
          ) : clients.isPending ? (
            <View style={styles.loading}>
              <SkeletonList />
            </View>
          ) : (
            <EmptyState title={t('money.periodClients.empty')} />
          )
        }
        renderItem={({ item, index }) => {
          const name = [item.first_name, item.last_name].filter(Boolean).join(' ');
          const visits = t(`money.visits_${pluralCategory(item.visits, ctx.locale)}`, {
            count: item.visits,
          });
          return (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push(`/clients/${item.client_id}`)}
              style={[styles.row, index > 0 && styles.divided]}>
              <Avatar name={name} color={item.avatar_color} size="md" />
              <View style={styles.body}>
                <View style={styles.nameRow}>
                  <Text variant="subheadStrong" numberOfLines={1} style={styles.name}>
                    {name}
                  </Text>
                  {item.is_new ? (
                    <View style={styles.newBadge}>
                      <Text variant="caption2Medium" color="brand">
                        {t('money.periodClients.newBadge')}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text variant="caption" color="tertiary" tabularNums>
                  {t('money.periodClients.sub', { visits, last: lastLabel(item.last_visit) })}
                </Text>
              </View>
              <Text variant="subheadStrong" tabularNums>
                {ctx.money(item.amount)}
              </Text>
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: {
    paddingTop: theme.space[2],
    paddingHorizontal: theme.space[5],
    paddingBottom: theme.space[10],
  },
  tiles: { flexDirection: 'row', gap: theme.space[2] },
  tile: {
    flex: 1,
    gap: 2,
    padding: theme.space[3],
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.bg.surface,
  },
  chips: { marginTop: theme.space[3.5], flexDirection: 'row', gap: theme.space[1.5] },
  meta: {
    marginTop: theme.space[3.5],
    marginBottom: theme.space[1],
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loading: { marginTop: theme.space[3] },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  divided: { borderTopWidth: 1, borderTopColor: theme.colors.bg.sunken },
  body: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  name: { flexShrink: 1 },
  newBadge: {
    height: 18,
    justifyContent: 'center',
    paddingHorizontal: 7,
    borderRadius: 9,
    backgroundColor: theme.colors.brand.subtle,
  },
}));
