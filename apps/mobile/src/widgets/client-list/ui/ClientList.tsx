/**
 * The "Клиенты" tab (design "Клиенты"): title with the add button, search by name or
 * phone, filter chips with counts, then the book — VIP first, the rest after — each
 * row with when the client was last here and how many visits. Clients due for a
 * call get "Позвать": WhatsApp with a ready text.
 */
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useDismissAttentionMutation } from '@/entities/attention';
import {
  CLIENT_SEGMENTS,
  inSegment,
  isNewClient,
  matchesClientQuery,
  type ClientSegment,
} from '@/entities/client';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { formatTime } from '@/shared/lib/formats';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { whatsappUrl } from '@/shared/lib/phone';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  SearchField,
  Skeleton,
  Text,
  VipBadge,
} from '@/shared/ui';
import { seenOf, type Seen } from '../model/seen';
import { useClientList, type ClientRow } from '../model/useClientList';

const DAY_MS = 86_400_000;
/** After "Позвать", give the client time to answer before suggesting it again. */
const INVITED_DAYS = 14;

type Item =
  | { type: 'section'; key: string; label: string }
  | { type: 'hint'; key: string }
  | { type: 'row'; key: string; row: ClientRow };

export function ClientList() {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const list = useClientList();
  const dismiss = useDismissAttentionMutation(useUserId() ?? '');
  const [segment, setSegment] = useState<ClientSegment>('all');
  const [query, setQuery] = useState('');

  const items = useMemo<Item[]>(() => {
    const rows = list.rows.filter(
      (row) =>
        inSegment(segment, { ...row, recall: !!row.recall }) &&
        matchesClientQuery(row.client, query),
    );
    const out: Item[] = segment === 'recall' ? [{ type: 'hint', key: 'hint' }] : [];
    const toItem = (row: ClientRow): Item => ({ type: 'row', key: row.client.id, row });
    const vip = rows.filter((row) => row.client.is_favorite);
    // The VIP block on top only in the full, unsearched book.
    if (segment !== 'all' || query.trim() || vip.length === 0) return [...out, ...rows.map(toItem)];
    const rest = rows.filter((row) => !row.client.is_favorite);
    return [
      { type: 'section', key: 'vip', label: t('clients.list.sectionVip') },
      ...vip.map(toItem),
      ...(rest.length
        ? [{ type: 'section', key: 'rest', label: t('clients.list.sectionRest') } as Item]
        : []),
      ...rest.map(toItem),
    ];
  }, [list.rows, segment, query, t]);

  const openNew = () => router.push('/client/new');

  const seenLabel = (seen: Seen): string => {
    switch (seen.kind) {
      case 'todayAt':
        return t('clients.list.seen.todayAt', {
          time: formatTime(seen.at, { zone: list.zone, timeFormat: list.timeFormat }),
        });
      case 'days':
      case 'weeks':
      case 'months':
        return t(`clients.list.seen.${seen.kind}_${pluralCategory(seen.count, locale)}`, {
          count: seen.count,
        });
      case 'booked':
        return t('clients.list.seen.booked', {
          date: new Date(seen.at).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            timeZone: list.zone,
          }),
        });
      default:
        return t(`clients.list.seen.${seen.kind}`);
    }
  };

  const metaOf = (row: ClientRow) => {
    const seen = seenOf(row.summary, list.now, list.zone);
    const visits = row.summary?.visits ?? 0;
    if (seen.kind === 'never' || seen.kind === 'booked') return seenLabel(seen);
    return `${seenLabel(seen)} · ${t(`clients.list.visits_${pluralCategory(visits, locale)}`, {
      count: visits,
    })}`;
  };

  const invite = ({ client }: ClientRow) => {
    const phone = client.whatsapp ?? client.phone;
    if (!phone) return;
    void Linking.openURL(
      whatsappUrl(phone, t('clients.list.recallMessage', { name: client.first_name })),
    );
    dismiss.mutate([
      {
        key: `recall:${client.id}`,
        until: new Date(list.now + INVITED_DAYS * DAY_MS).toISOString(),
      },
    ]);
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + theme.space[1] }]}>
      <View style={styles.titleRow}>
        <Text variant="pageTitle" accessibilityRole="header" style={styles.grow}>
          {t('clients.list.title')}
        </Text>
        <IconButton
          icon="userAdd"
          variant="neutral"
          size="lg"
          accessibilityLabel={t('clients.list.add')}
          onPress={openNew}
        />
      </View>
      <View style={styles.search}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('clients.list.search')}
          accessibilityLabel={t('clients.list.searchA11y')}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}
        accessibilityLabel={t('clients.list.filtersA11y')}>
        {CLIENT_SEGMENTS.map((key) => {
          const on = segment === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setSegment(key)}
              style={({ pressed }) => [styles.filter, on && styles.filterOn, pressed && styles.pressed]}>
              <Text variant="footnoteStrong" color={on ? 'onAccent' : 'primary'}>
                {t(`clients.list.filters.${key}`)}
              </Text>
              <Text variant="footnoteStrong" color={on ? 'onAccent' : 'primary'} style={styles.count}>
                {list.counts[key]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (list.isPending) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.skeleton}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={56} radius={theme.radius.lg} />
          ))}
        </View>
      </View>
    );
  }

  if (list.error && list.rows.length === 0) {
    return (
      <View style={styles.root}>
        {header}
        <ErrorState
          message={t(errorMessageKey(normalizeError(list.error)))}
          onRetry={() => void list.refetch()}
        />
      </View>
    );
  }

  if (list.rows.length === 0) {
    return (
      <View style={styles.root}>
        {header}
        <EmptyState
          icon="clients"
          title={t('clients.list.emptyTitle')}
          description={t('clients.list.emptyText')}
          actionLabel={t('clients.list.add')}
          onAction={openNew}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
        refreshControl={
          <RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} />
        }
        ListEmptyComponent={
          <Text variant="subhead" color="secondary" align="center" style={styles.nobody}>
            {t('clients.list.nobody')}
          </Text>
        }
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <Text variant="overline" color="secondary" style={styles.section}>
                {item.label}
              </Text>
            );
          }
          if (item.type === 'hint') {
            return (
              <View style={styles.hint}>
                <Text variant="footnote" color="secondary">
                  {t('clients.list.recallHint')}
                </Text>
              </View>
            );
          }
          return (
            <ClientRowView
              row={item.row}
              meta={metaOf(item.row)}
              onOpen={() =>
                router.push({
                  pathname: '/clients/[clientId]',
                  params: { clientId: item.row.client.id },
                })
              }
              onInvite={() => invite(item.row)}
            />
          );
        }}
      />
    </View>
  );
}

function ClientRowView({
  row,
  meta,
  onOpen,
  onInvite,
}: {
  row: ClientRow;
  meta: string;
  onOpen: () => void;
  onInvite: () => void;
}) {
  const { t } = useTranslation();
  const { client } = row;
  const canInvite = !!row.recall && !!(client.whatsapp ?? client.phone);
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
        <Avatar name={row.name} color={client.avatar_color} size="md" />
        <View style={styles.rowText}>
          <View style={styles.nameLine}>
            <Text variant="bodyStrong" numberOfLines={1} style={styles.shrink}>
              {row.name}
            </Text>
            {client.is_favorite ? <VipBadge accessibilityLabel={t('clients.list.vipA11y')} /> : null}
            {isNewClient(row.summary?.visits ?? 0) ? (
              <View style={[styles.badge, styles.badgeNew]}>
                <Text variant="micro" style={styles.badgeNewText}>
                  {t('clients.list.badgeNew')}
                </Text>
              </View>
            ) : null}
            {client.source === 'online_booking' ? (
              <View style={[styles.badge, styles.badgeOnline]}>
                <Text variant="micro" color="secondary">
                  {t('clients.list.badgeOnline')}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="footnote" color="secondary" numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </Pressable>
      {canInvite ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('clients.list.inviteA11y', { name: row.name })}
          onPress={onInvite}
          style={({ pressed }) => [styles.invite, pressed && styles.invitePressed]}>
          <Icon name="whatsapp" size={14} />
          <Text variant="footnoteStrong" color="onAccent">
            {t('clients.list.invite')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  header: { paddingHorizontal: theme.space[5] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  grow: { flex: 1 },
  search: { paddingTop: theme.space[3.5] },
  filtersScroll: { flexGrow: 0, marginHorizontal: -theme.space[5] },
  filters: {
    gap: theme.space[1.5],
    paddingTop: theme.space[3],
    paddingBottom: theme.space[1],
    paddingHorizontal: theme.space[5],
  },
  filter: {
    height: theme.sizing.control.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.5],
    paddingHorizontal: theme.space[3],
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.bg.canvas,
  },
  filterOn: {
    borderColor: theme.colors.accent.default,
    backgroundColor: theme.colors.accent.default,
  },
  count: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
  skeleton: { padding: theme.space[5], gap: theme.space[3] },
  list: { paddingHorizontal: theme.space[5], paddingTop: theme.space[1.5] },
  nobody: { paddingVertical: theme.space[10] },
  section: { marginTop: theme.space[4], marginBottom: theme.space[0.5] },
  hint: {
    marginTop: theme.space[1.5],
    marginBottom: theme.space[1],
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[3],
  },
  rowText: { flex: 1, minWidth: 0, gap: theme.space[0.5] },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  shrink: { flexShrink: 1 },
  badge: {
    height: 20,
    paddingHorizontal: theme.space[2],
    borderRadius: 10,
    justifyContent: 'center',
  },
  badgeNew: { backgroundColor: theme.colors.tone.brand.bg },
  badgeNewText: { color: theme.colors.tone.brand.fg },
  badgeOnline: { backgroundColor: theme.colors.bg.surface },
  invite: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.5],
    paddingHorizontal: theme.space[3],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent.default,
  },
  invitePressed: { opacity: 0.85 },
}));
