/**
 * "Расходы" (menu "Деньги"). The design has no board for this page, only the row and
 * the sheet, so it is built from them: the month with arrows, its total, then the
 * expenses by day as in "Операции". "+" in the native bar opens "Новый расход"; a row
 * opens its form, which also deletes.
 */
import { useMemo, useState } from 'react';
import { router, Stack } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useExpensesRangeQuery, type Expense } from '@/entities/expense';
import { useMoneyContext } from '@/entities/master';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import {
  EmptyState,
  ErrorState,
  Icon,
  SkeletonList,
  Text,
  useNow,
  useRefreshControl,
} from '@/shared/ui';
import { ExpenseRow } from './ExpenseRow';

type Item =
  | { type: 'day'; key: string; day: string; sum: number }
  | { type: 'row'; key: string; expense: Expense; divided: boolean };

export function ExpensesScreen() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const ctx = useMoneyContext(userId);
  const now = useNow();
  const today = DateTime.fromMillis(now, { zone: ctx.zone });
  const [offset, setOffset] = useState(0);

  const month = today.startOf('month').plus({ months: offset });
  const fromKey = month.toISODate()!;
  const toKey = month.endOf('month').toISODate()!;
  const expenses = useExpensesRangeQuery(userId, fromKey, toKey);
  const refreshControl = useRefreshControl(() => expenses.refetch());

  const list = useMemo(() => expenses.data ?? [], [expenses.data]);
  const total = list.reduce((sum, e) => sum + e.amount, 0);
  const items = useMemo(() => {
    const out: Item[] = [];
    list.forEach((expense, index) => {
      const first = list[index - 1]?.spent_on !== expense.spent_on;
      if (first) {
        out.push({
          type: 'day',
          key: `day-${expense.spent_on}`,
          day: expense.spent_on,
          sum: list
            .filter((e) => e.spent_on === expense.spent_on)
            .reduce((sum, e) => sum + e.amount, 0),
        });
      }
      out.push({ type: 'row', key: expense.id, expense, divided: !first });
    });
    return out;
  }, [list]);

  const months = t('months', { returnObjects: true }) as string[];
  const genitive = t('monthsGenitive', { returnObjects: true }) as string[];
  const weekdays = t('weekdays.long', { returnObjects: true }) as string[];
  const dayTitle = (key: string) => {
    const date = DateTime.fromISO(key, { zone: 'utc' });
    return `${date.day} ${genitive[date.month - 1]}, ${weekdays[date.weekday - 1]?.toLowerCase()}`;
  };
  const add = () =>
    router.push(
      offset === 0 ? '/expense/new' : { pathname: '/expense/new', params: { day: toKey } },
    );

  const header = (
    <View>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('money.prevMonth')}
          onPress={() => setOffset((o) => o - 1)}
          style={styles.arrow}>
          <Icon name="chevronLeft" size="base" color="content.primary" />
        </Pressable>
        <Text variant="bodyStrong">{`${months[month.month - 1]} ${month.year}`}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('money.nextMonth')}
          accessibilityState={{ disabled: offset === 0 }}
          disabled={offset === 0}
          onPress={() => setOffset((o) => o + 1)}
          style={styles.arrow}>
          <Icon
            name="chevronRight"
            size="base"
            color={offset === 0 ? 'content.disabled' : 'content.primary'}
          />
        </Pressable>
      </View>
      <View style={styles.total}>
        <Text variant="caption" color="secondary">
          {t('expenses.total')}
        </Text>
        <Text variant="title2" tabularNums>
          {ctx.money(total)}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="plus" accessibilityLabel={t('expenses.add')} onPress={add} />
      </Stack.Toolbar>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={styles.root}
        contentContainerStyle={styles.content}
        data={items}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={header}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          expenses.isError ? (
            <ErrorState
              message={t(errorMessageKey(normalizeError(expenses.error)))}
              onRetry={() => void expenses.refetch()}
            />
          ) : expenses.isPending ? (
            <View style={styles.loading}>
              <SkeletonList />
            </View>
          ) : (
            <EmptyState
              icon="receipt"
              title={t('expenses.empty')}
              description={t('expenses.emptyHint')}
              actionLabel={t('expenses.add')}
              onAction={add}
            />
          )
        }
        renderItem={({ item }) =>
          item.type === 'day' ? (
            <View style={styles.dayHeader}>
              <Text variant="footnoteStrong">{dayTitle(item.day)}</Text>
              <Text variant="caption" color="tertiary" tabularNums>
                {`−${ctx.money(item.sum)}`}
              </Text>
            </View>
          ) : (
            <ExpenseRow
              expense={item.expense}
              amount={ctx.money(item.expense.amount)}
              divided={item.divided}
            />
          )
        }
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
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  total: {
    marginTop: theme.space[2],
    gap: 2,
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.bg.surface,
  },
  loading: { marginTop: theme.space[5] },
  dayHeader: {
    marginTop: theme.space[5],
    marginBottom: theme.space[1.5],
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
}));
