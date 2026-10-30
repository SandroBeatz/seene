/**
 * "Объединить дубли": who looks like the same person (same number, same or similar
 * name) on top, everyone else by search below. Picking one asks to confirm, then the
 * picked card's visits and payments move to this client and it is deleted.
 */
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import {
  clientName,
  duplicateCandidates,
  matchesClientQuery,
  useClientsQuery,
  useMergeClientsMutation,
  type Client,
  type DuplicateReason,
} from '@/entities/client';
import { useUserId } from '@/entities/session';
import { formatPhone } from '@/shared/lib/phone';
import { Avatar, Icon, IconButton, SearchField, Skeleton, Text } from '@/shared/ui';

type Item =
  | { type: 'section'; key: string; label: string }
  | { type: 'note'; key: string }
  | { type: 'client'; key: string; client: Client; reason: DuplicateReason | null };

export function MergeClients({ client }: { client: Client }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const userId = useUserId() ?? '';
  const clients = useClientsQuery(userId);
  const merge = useMergeClientsMutation(userId);
  const [query, setQuery] = useState('');
  const keepName = clientName(client);

  const items = useMemo<Item[]>(() => {
    const all = clients.data ?? [];
    const toItem = (c: Client, reason: DuplicateReason | null): Item => ({
      type: 'client',
      key: c.id,
      client: c,
      reason,
    });
    if (query.trim()) {
      return all
        .filter((c) => c.id !== client.id && matchesClientQuery(c, query))
        .map((c) => toItem(c, null));
    }
    const suggested = duplicateCandidates(client, all);
    return [
      { type: 'section', key: 'suggested', label: t('clients.merge.suggested') },
      ...(suggested.length
        ? suggested.map((s) => toItem(s.client, s.reason))
        : [{ type: 'note', key: 'none' } as Item]),
    ];
  }, [clients.data, client, query, t]);

  const pick = (other: Client) => {
    const mergeName = clientName(other);
    Alert.alert(
      t('clients.merge.confirmTitle', { name: mergeName }),
      t('clients.merge.confirmText', { merge: mergeName, keep: keepName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('clients.merge.confirm'),
          style: 'destructive',
          onPress: () =>
            merge.mutate(
              { keepId: client.id, mergeId: other.id },
              {
                onSuccess: () => router.back(),
                onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
              },
            ),
        },
      ],
    );
  };

  return (
    // Kept as a real view: a form sheet (react-native-screens) pins a ScrollView that
    // is a direct child of the screen to the top and stretches it over the header.
    <View style={styles.root} collapsable={false}>
      <View style={styles.grabber} />
      <View style={styles.header}>
        <IconButton
          icon="close"
          variant="neutral"
          accessibilityLabel={t('clients.form.close')}
          onPress={() => router.back()}
        />
        <Text variant="calloutStrong" align="center" style={styles.title}>
          {t('clients.merge.title')}
        </Text>
        <View style={styles.spacer} />
      </View>
      <Text variant="footnote" color="secondary" style={styles.hint}>
        {t('clients.merge.hint', { name: keepName })}
      </Text>
      <View style={styles.search}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('clients.merge.search')}
          accessibilityLabel={t('clients.merge.search')}
        />
      </View>
      {clients.isPending ? (
        <View style={styles.skeleton}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={52} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          renderItem={({ item }) => {
            if (item.type === 'section') {
              return (
                <Text variant="overline" color="secondary" style={styles.section}>
                  {item.label}
                </Text>
              );
            }
            if (item.type === 'note') {
              return (
                <Text variant="subhead" color="secondary" style={styles.none}>
                  {t('clients.merge.none')}
                </Text>
              );
            }
            const name = clientName(item.client);
            const detail = [
              item.reason ? t(`clients.merge.reasons.${item.reason}`) : null,
              item.client.phone ? formatPhone(item.client.phone) : null,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <Pressable
                accessibilityRole="button"
                disabled={merge.isPending}
                onPress={() => pick(item.client)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Avatar name={name} color={item.client.avatar_color} size="md" />
                <View style={styles.grow}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {name}
                  </Text>
                  {detail ? (
                    <Text variant="footnote" color="secondary" numberOfLines={1}>
                      {detail}
                    </Text>
                  ) : null}
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
  grabber: {
    alignSelf: 'center',
    marginTop: theme.space[2],
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.space[2],
    paddingHorizontal: theme.space[4],
  },
  title: { flex: 1 },
  spacer: { width: theme.sizing.iconButton },
  hint: { paddingTop: theme.space[3], paddingHorizontal: theme.space[4] },
  search: { paddingTop: theme.space[3], paddingHorizontal: theme.space[4] },
  skeleton: { padding: theme.space[4], gap: theme.space[3] },
  list: { paddingHorizontal: theme.space[4] },
  section: { marginTop: theme.space[4], marginBottom: theme.space[1] },
  none: { paddingVertical: theme.space[3] },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  grow: { flex: 1, minWidth: 0, gap: 2 },
  pressed: { opacity: 0.7 },
}));
