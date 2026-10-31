/**
 * "Новая запись · 1 из 4: клиент" (design "AppNewClient"): search by name or phone,
 * "Новый клиент" (the client form, then straight on to the services), the three
 * clients seen most recently, then the whole book. A tap picks the client and goes on.
 */
import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { DateTime } from 'luxon';
import { FlatList, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { clientName, matchesClientQuery, seenOf, type Client, type Seen } from '@/entities/client';
import { pluralCategory } from '@/shared/lib/i18n';
import { Avatar, Icon, SearchField, Skeleton, Text, VipBadge, useNow } from '@/shared/ui';
import { useQuickCreateDraft } from '../model/draft.store';
import { useFlowData } from '../model/useFlowData';
import { StepChrome } from './StepChrome';

const RECENT_COUNT = 3;

type Item =
  | { type: 'new'; key: string }
  | { type: 'section'; key: string; label: string }
  | { type: 'row'; key: string; client: Client; meta: string };

export function ClientStep() {
  const flow = useFlowData();
  const { t, locale, zone, summaries } = flow;
  const now = useNow();
  const [query, setQuery] = useState('');

  // Back from "Новый клиент" with the client just made: on to the services.
  useFocusEffect(
    useCallback(() => {
      // Read outside React state: the flag is consumed once.
      if (useQuickCreateDraft.getState().consumeAdvance()) router.push('/quick-create/services');
    }, []),
  );

  const seenLabel = useCallback(
    (seen: Seen): string => {
      switch (seen.kind) {
        case 'todayAt':
          return t('quickCreate.client.today');
        case 'days':
        case 'weeks':
        case 'months':
          return t(`clients.list.seen.${seen.kind}_${pluralCategory(seen.count, locale)}`, {
            count: seen.count,
          });
        case 'booked':
        case 'never':
          return t('quickCreate.client.new');
        default:
          return t(`clients.list.seen.${seen.kind}`);
      }
    },
    [t, locale],
  );

  const items = useMemo<Item[]>(() => {
    const sorted = [...flow.clients].sort((a, b) => clientName(a).localeCompare(clientName(b)));
    // A recent client is listed twice (recent and the whole book): the key names the section.
    const row = (client: Client, meta: string, section = 'all'): Item => ({
      type: 'row',
      key: `${section}:${client.id}`,
      client,
      meta,
    });
    const seen = (client: Client) => seenLabel(seenOf(summaries?.get(client.id), now, zone));
    if (query.trim()) {
      return sorted.filter((c) => matchesClientQuery(c, query)).map((c) => row(c, seen(c)));
    }
    const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
    const recent = sorted
      .filter((c) => summaries?.get(c.id)?.lastVisit)
      .sort((a, b) =>
        (summaries?.get(b.id)?.lastVisit ?? '').localeCompare(
          summaries?.get(a.id)?.lastVisit ?? '',
        ),
      )
      .slice(0, RECENT_COUNT);
    const lastVisit = (c: Client) => {
      const day = DateTime.fromISO(summaries!.get(c.id)!.lastVisit!, { zone: 'utc' }).setZone(zone);
      return t('quickCreate.client.lastVisit', {
        date: `${day.day} ${monthsShort[day.month - 1]}`,
      });
    };
    return [
      { type: 'new', key: 'new' },
      ...(recent.length
        ? [
            { type: 'section', key: 'recent', label: t('quickCreate.client.recent') } as Item,
            ...recent.map((c) => row(c, lastVisit(c), 'recent')),
          ]
        : []),
      ...(sorted.length
        ? [
            {
              type: 'section',
              key: 'all',
              label: t('quickCreate.client.all', { count: sorted.length }),
            } as Item,
            ...sorted.map((c) => row(c, seen(c))),
          ]
        : []),
    ];
  }, [flow.clients, summaries, query, now, zone, t, seenLabel]);

  const pick = (client: Client) => {
    flow.draft.setClient(client.id);
    router.push('/quick-create/services');
  };

  return (
    <View style={styles.root} collapsable={false}>
      <StepChrome step={1} subtitle={t('quickCreate.client.subtitle')} client={null} />
      <View style={styles.search}>
        <SearchField
          accessibilityLabel={t('quickCreate.client.searchA11y')}
          placeholder={t('quickCreate.client.search')}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {flow.isPending ? (
        <View style={styles.skeleton}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={56} radius={16} />
          ))}
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text variant="subhead" color="secondary" align="center" style={styles.nobody}>
              {t('clients.list.nobody')}
            </Text>
          }
          renderItem={({ item }) => {
            if (item.type === 'new') {
              return (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: '/client/new', params: { for: 'appointment' } })
                  }
                  style={({ pressed }) => [styles.newRow, pressed && styles.pressed]}>
                  <View style={styles.newMark}>
                    <Icon name="add" size="md" color="content.primary" />
                  </View>
                  <View style={styles.rowText}>
                    <Text variant="bodyStrong">{t('quickCreate.client.newTitle')}</Text>
                    <Text variant="footnote" color="tertiary">
                      {t('quickCreate.client.newHint')}
                    </Text>
                  </View>
                </Pressable>
              );
            }
            if (item.type === 'section') {
              return (
                <Text variant="overline" color="secondary" style={styles.section}>
                  {item.label}
                </Text>
              );
            }
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => pick(item.client)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Avatar name={clientName(item.client)} color={item.client.avatar_color} size="md" />
                <View style={styles.rowText}>
                  <View style={styles.nameLine}>
                    <Text variant="bodyStrong" numberOfLines={1} style={styles.shrink}>
                      {clientName(item.client)}
                    </Text>
                    {item.client.is_favorite ? (
                      <VipBadge accessibilityLabel={t('clients.list.vipA11y')} />
                    ) : null}
                  </View>
                  <Text variant="footnote" color="tertiary" numberOfLines={1}>
                    {item.meta}
                  </Text>
                </View>
                <Icon name="chevronRight" size="sm" color="content.tertiary" />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  search: { paddingTop: theme.space[3.5], paddingHorizontal: theme.space[4] },
  skeleton: { padding: theme.space[4], gap: theme.space[3] },
  list: { flex: 1 },
  listContent: {
    paddingTop: theme.space[1.5],
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[10],
  },
  nobody: { paddingVertical: theme.space[10] },
  newRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[2],
  },
  newMark: {
    width: theme.sizing.avatar.md,
    height: theme.sizing.avatar.md,
    borderRadius: theme.sizing.avatar.md / 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: theme.space[5], marginBottom: theme.space[1] },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[2.5],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  shrink: { flexShrink: 1 },
  pressed: { opacity: 0.7 },
}));
