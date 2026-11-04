/**
 * "Уведомления" (design AppNotifs, AppNotifsMore, AppNotifsEmpty): the filter chips with their
 * counts, how many are new, and the feed by day. Only the master's, clients get nothing.
 */
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useMoneyContext } from '@/entities/master';
import {
  categoryOf,
  groupByDay,
  notificationKeys,
  useDeleteNotificationMutation,
  useDeleteReadNotificationsMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  type Notification,
  type NotificationCategory,
} from '@/entities/notification';
import { useUserId } from '@/entities/session';
import {
  Chip,
  ChipRow,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  ScreenScrollView,
  SectionLabel,
  SkeletonList,
  Text,
  removeWithUndo,
  showFailedToast,
  useNow,
} from '@/shared/ui';
import { NotificationCard } from './NotificationCard';

type Filter = 'all' | NotificationCategory;

const FILTERS: Filter[] = ['all', 'visits', 'clients', 'money', 'seene'];

export function NotificationsScreen() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const now = useNow();
  const { zone } = useMoneyContext(userId);
  const feed = useNotificationsQuery(userId);
  const markRead = useMarkNotificationReadMutation(userId);
  const markAll = useMarkAllNotificationsReadMutation(userId);
  const remove = useDeleteNotificationMutation(userId);
  const clear = useDeleteReadNotificationsMutation(userId);
  const [filter, setFilter] = useState<Filter>('all');

  const keys = [notificationKeys.all(userId)];
  const rows = feed.data ?? [];
  const count = (which: Filter) =>
    which === 'all' ? rows.length : rows.filter((row) => categoryOf(row) === which).length;
  const shown = filter === 'all' ? rows : rows.filter((row) => categoryOf(row) === filter);
  const unread = rows.filter((row) => !row.read_at).length;

  const readAll = () => markAll.mutate(undefined, { onError: () => showFailedToast(readAll) });
  const read = (row: Notification) => {
    if (!row.read_at) markRead.mutate(row.id);
  };

  const deleteOne = (row: Notification) =>
    removeWithUndo({
      title: t('notifications.deleted'),
      id: row.id,
      keys,
      commit: () => remove.mutateAsync(row.id),
    });

  const clearRead = () =>
    removeWithUndo({
      title: t('notifications.cleared'),
      where: (row) => !!(row as Notification).read_at,
      keys,
      commit: () => clear.mutateAsync(),
    });

  const menu = (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel={t('notifications.more')}>
        <Stack.Toolbar.MenuAction icon="checkmark.circle" onPress={readAll}>
          {t('notifications.readAll')}
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="trash" destructive onPress={clearRead}>
          {t('notifications.clearRead')}
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );

  const header =
    process.env.EXPO_OS === 'ios' ? (
      menu
    ) : (
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="more"
              accessibilityLabel={t('notifications.more')}
              onPress={() =>
                Alert.alert(t('notifications.more'), undefined, [
                  { text: t('notifications.readAll'), onPress: readAll },
                  {
                    text: t('notifications.clearRead'),
                    style: 'destructive',
                    onPress: clearRead,
                  },
                  { text: t('common.cancel'), style: 'cancel' },
                ])
              }
            />
          ),
        }}
      />
    );

  if (feed.isPending) {
    return (
      <ScreenScrollView contentContainerStyle={styles.content}>
        <SkeletonList rows={4} />
      </ScreenScrollView>
    );
  }

  if (feed.error) {
    return <ErrorState onRetry={() => void feed.refetch()} />;
  }

  if (rows.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon="bell"
          title={t('notifications.emptyTitle')}
          description={t('notifications.emptyText')}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <ScreenScrollView contentContainerStyle={styles.content}>
        <ChipRow>
          {FILTERS.filter((which) => which === 'all' || count(which) > 0).map((which) => (
            <Chip
              key={which}
              shape="pill"
              size="filter"
              selected={filter === which}
              label={`${t(`notifications.filters.${which}`)} ${count(which)}`}
              onPress={() => setFilter(which)}
            />
          ))}
        </ChipRow>

        <View style={styles.summary}>
          <Text variant="footnote" color="secondary" tabularNums>
            {unread ? t('notifications.newCount', { count: unread }) : t('notifications.allRead')}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!unread}
            onPress={readAll}
            style={[styles.readAll, !unread && styles.faded]}>
            <Icon name="check" size={14} color="content.primary" />
            <Text variant="footnoteStrong">{t('notifications.readAll')}</Text>
          </Pressable>
        </View>

        {groupByDay(shown, zone, now).map((group) => (
          <View key={group.day}>
            <View style={styles.day}>
              <SectionLabel label={t(`notifications.days.${group.day}`)} />
            </View>
            <View style={styles.list}>
              {group.rows.map((row) => (
                <NotificationCard
                  key={row.id}
                  item={row}
                  now={now}
                  onOpen={() => read(row)}
                  onRead={() => read(row)}
                  onDelete={() => deleteOne(row)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScreenScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    paddingHorizontal: theme.space[5],
    paddingTop: theme.space[2],
    paddingBottom: theme.space[10],
  },
  summary: {
    marginTop: theme.space[3.5],
    paddingHorizontal: theme.space[1],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readAll: {
    height: 32,
    paddingHorizontal: theme.space[3],
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.bg.surface,
  },
  faded: { opacity: 0.4 },
  day: { marginTop: theme.space[5], marginBottom: 2, marginHorizontal: theme.space[1] },
  list: { gap: theme.space[2], marginTop: theme.space[2] },
}));
