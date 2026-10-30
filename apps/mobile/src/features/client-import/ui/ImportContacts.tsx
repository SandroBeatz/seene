/**
 * The phone book as a list to tick: search, "Выбрать всех", each contact with their
 * number (or "Без номера"), those already in the book greyed out, and "Добавить N
 * клиентов" at the bottom.
 */
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Linking, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { matchesClientQuery } from '@/entities/client';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { formatPhone, type CountryCode } from '@/shared/lib/phone';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  SearchField,
  SelectionMark,
  Skeleton,
  Text,
} from '@/shared/ui';
import { usePhoneBookImport } from '../model/usePhoneBookImport';

export function ImportContacts({ country }: { country: CountryCode }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const book = usePhoneBookImport(country);
  const [query, setQuery] = useState('');

  const visible = useMemo(
    () =>
      book.rows.filter((row) =>
        matchesClientQuery(
          { first_name: row.card.first_name, last_name: row.card.last_name ?? null, phone: row.phone },
          query,
        ),
      ),
    [book.rows, query],
  );
  const selectable = visible.filter((row) => !row.exists);
  const allPicked = selectable.length > 0 && selectable.every((row) => book.picked.has(row.contactId));
  const count = book.cards.length;

  const submit = () =>
    book.save.mutate(book.cards, {
      onSuccess: (added) => {
        Alert.alert(t(`clients.import.done_${pluralCategory(added, locale)}`, { count: added }));
        router.back();
      },
      onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
    });

  let body;
  if (book.isLoading) {
    body = (
      <View style={styles.skeleton}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={52} />
        ))}
      </View>
    );
  } else if (book.failed) {
    body = <ErrorState onRetry={() => void book.retry()} />;
  } else if (book.access === 'none') {
    body = (
      <EmptyState
        icon="contacts"
        title={t('clients.import.deniedTitle')}
        description={t('clients.import.deniedText')}
        actionLabel={t('clients.import.openSettings')}
        onAction={() => void Linking.openSettings()}
      />
    );
  } else if (book.rows.length === 0) {
    body = <EmptyState icon="contacts" title={t('clients.import.empty')} />;
  } else {
    body = (
      <FlatList
        data={visible}
        keyExtractor={(row) => row.contactId}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.list, { paddingBottom: 120 + insets.bottom }]}
        ListHeaderComponent={
          book.access === 'limited' ? (
            <View style={styles.limited}>
              <Text variant="footnote" color="secondary" style={styles.grow}>
                {t('clients.import.limited')}
              </Text>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void book.shareMore()}>
                <Text variant="footnoteStrong" color="brand">
                  {t('clients.import.limitedMore')}
                </Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const on = book.picked.has(item.contactId);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on, disabled: item.exists }}
              disabled={item.exists}
              onPress={() => book.toggle(item.contactId)}
              style={({ pressed }) => [styles.row, item.exists && styles.muted, pressed && styles.pressed]}>
              <Avatar name={item.name} size="md" />
              <View style={styles.grow}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="footnote" color="secondary" numberOfLines={1} tabularNums>
                  {item.exists
                    ? t('clients.import.exists')
                    : item.phone
                      ? formatPhone(item.phone)
                      : item.unreadable
                        ? t('clients.import.unreadable')
                        : t('clients.import.noPhone')}
                </Text>
              </View>
              {item.exists ? null : <SelectionMark checked={on} />}
            </Pressable>
          );
        }}
      />
    );
  }

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
          {t('clients.import.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          disabled={selectable.length === 0}
          onPress={() =>
            book.setPicked((current) => {
              const next = new Set(current);
              for (const row of selectable) {
                if (allPicked) next.delete(row.contactId);
                else next.add(row.contactId);
              }
              return next;
            })
          }
          style={styles.selectAll}>
          <Text variant="footnoteStrong" color={selectable.length ? 'brand' : 'tertiary'} align="right">
            {allPicked ? t('clients.import.clearAll') : t('clients.import.selectAll')}
          </Text>
        </Pressable>
      </View>
      {book.rows.length > 0 ? (
        <View style={styles.search}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder={t('clients.import.search')}
            accessibilityLabel={t('clients.import.search')}
          />
        </View>
      ) : null}
      <View style={styles.body}>{body}</View>
      {book.rows.length > 0 ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            label={
              count
                ? t(`clients.import.submit_${pluralCategory(count, locale)}`, { count })
                : t('clients.import.pick')
            }
            disabled={!count}
            loading={book.save.isPending}
            onPress={submit}
            fullWidth
          />
        </View>
      ) : null}
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
    gap: theme.space[2],
    paddingTop: theme.space[2],
    paddingHorizontal: theme.space[4],
  },
  title: { flex: 1 },
  selectAll: { minWidth: theme.sizing.iconButton, maxWidth: 110 },
  search: { paddingTop: theme.space[3], paddingHorizontal: theme.space[4] },
  body: { flex: 1 },
  skeleton: { padding: theme.space[4], gap: theme.space[3] },
  list: { paddingHorizontal: theme.space[4], paddingTop: theme.space[2] },
  limited: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    marginBottom: theme.space[2],
    padding: theme.space[3],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  grow: { flex: 1, minWidth: 0, gap: 2 },
  muted: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  footer: {
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    backgroundColor: theme.colors.bg.elevated,
    boxShadow: theme.shadow.panel,
  },
}));
