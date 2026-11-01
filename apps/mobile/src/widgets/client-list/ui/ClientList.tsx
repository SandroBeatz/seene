/**
 * The "Клиенты" tab (design "Клиенты"): the native large title with the add button
 * and search by name or phone, filter chips with counts, then the book — VIP first, the rest after — each
 * row with when the client was last here and how many visits. Clients due for a
 * call get "Позвать": WhatsApp with a ready text.
 */
import { useMemo, useState } from 'react';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Linking, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useDismissAttentionMutation } from '@/entities/attention';
import {
  CLIENT_SEGMENTS,
  contactToCard,
  inSegment,
  isNewClient,
  matchesClientQuery,
  seenOf,
  type ClientSegment,
  type Seen,
} from '@/entities/client';
import { useUserId } from '@/entities/session';
import { usePhoneCountry } from '@/features/client-form';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { formatTime } from '@/shared/lib/formats';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { whatsappUrl } from '@/shared/lib/phone';
import { pickPhoneBookContact } from '@/shared/lib/phone-book';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Icon,
  ScreenScrollView,
  Skeleton,
  Text,
  VipBadge,
  useRefreshControl,
} from '@/shared/ui';
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
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const list = useClientList();
  const { country: phoneCountry } = usePhoneCountry();
  const dismiss = useDismissAttentionMutation(useUserId() ?? '');
  const [segment, setSegment] = useState<ClientSegment>('all');
  const [query, setQuery] = useState('');
  const refreshControl = useRefreshControl(list.refetch);

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
  const fromPhoneBook = async () => {
    try {
      const contact = await pickPhoneBookContact();
      const card = contact ? contactToCard(contact, phoneCountry) : null;
      if (!card) return;
      router.push({
        pathname: '/client/new',
        params: {
          firstName: card.first_name,
          lastName: card.last_name ?? '',
          phone: card.phone ?? '',
          birthDay: card.birth_day ? String(card.birth_day) : '',
          birthMonth: card.birth_month ? String(card.birth_month) : '',
        },
      });
    } catch {
      Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));
    }
  };

  const importButton = (
    <Pressable
      accessibilityRole="button"
      onPress={() => void fromPhoneBook()}
      style={({ pressed }) => [styles.import, pressed && styles.pressed]}>
      <Icon name="contacts" size="sm" color="content.primary" />
      <Text variant="bodyStrong">{t('clients.fromContacts')}</Text>
    </Pressable>
  );

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

  // Native chrome: the large title comes from the route, "add" and search live in
  // the header (Liquid Glass on iOS 26).
  const chrome = (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="person.badge.plus"
          accessibilityLabel={t('clients.list.add')}
          onPress={openNew}
        />
      </Stack.Toolbar>
      <Stack.SearchBar
        placeholder={t('clients.list.search')}
        // iOS 26: a search button in the bar next to "add" that opens a focused field.
        placement="integratedButton"
        autoCapitalize="none"
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
      />
    </>
  );

  const filters = (
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
            style={({ pressed }) => [
              styles.filter,
              on && styles.filterOn,
              pressed && styles.pressed,
            ]}>
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
  );

  if (list.isPending) {
    return (
      <ScreenScrollView padded={false} scrollEnabled={false}>
        {chrome}
        <View style={styles.skeleton}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={56} radius={theme.radius.lg} />
          ))}
        </View>
      </ScreenScrollView>
    );
  }

  if (list.error && list.rows.length === 0) {
    return (
      <ScreenScrollView padded={false} contentContainerStyle={styles.grow}>
        {chrome}
        <ErrorState
          message={t(errorMessageKey(normalizeError(list.error)))}
          onRetry={() => void list.refetch()}
        />
      </ScreenScrollView>
    );
  }

  if (list.rows.length === 0) {
    return (
      <ScreenScrollView padded={false} contentContainerStyle={styles.grow}>
        {chrome}
        <EmptyState
          icon="clients"
          title={t('clients.list.emptyTitle')}
          description={t('clients.list.emptyText')}
          actionLabel={t('clients.list.add')}
          onAction={openNew}
        />
        <View style={styles.emptyImport}>{importButton}</View>
      </ScreenScrollView>
    );
  }

  return (
    // The list is the screen's first view, so the large title collapses into the bar
    // as it scrolls and comes back at the top.
    <>
      {chrome}
      <FlatList
        style={styles.root}
        data={items}
        contentInsetAdjustmentBehavior="automatic"
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={refreshControl}
        ListHeaderComponent={filters}
        ListFooterComponent={importButton}
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
    </>
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
            {client.is_favorite ? (
              <VipBadge accessibilityLabel={t('clients.list.vipA11y')} />
            ) : null}
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
  grow: { flex: 1 },
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
  list: { paddingHorizontal: theme.space[5], paddingBottom: theme.space[8] },
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
  import: {
    marginTop: theme.space[4],
    height: theme.sizing.control.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    borderRadius: theme.radius.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
  },
  emptyImport: { paddingHorizontal: theme.space[5] },
}));
