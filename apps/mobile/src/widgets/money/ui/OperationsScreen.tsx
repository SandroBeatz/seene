/**
 * "Операции" (design "Операции"): the period's paid visits and expenses by day, newest
 * first, with the income and expense totals and the filter chips. A visit opens its
 * sheet, an expense its form.
 */
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useSaleOperationsQuery, type SaleOperation } from '@/entities/analytics';
import { useExpensesRangeQuery, type Expense } from '@/entities/expense';
import { useMoneyContext } from '@/entities/master';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { Avatar, Chip, EmptyState, ErrorState, SkeletonList, Text, useRefreshControl } from '@/shared/ui';
import { usePeriod, usePeriodName } from '../model/usePeriod';
import { ExpenseRow } from './ExpenseRow';

type Filter = 'all' | 'in' | 'out';
const FILTERS: Filter[] = ['all', 'in', 'out'];

type Operation =
  | { type: 'sale'; day: string; sort: string; sale: SaleOperation }
  | { type: 'expense'; day: string; sort: string; expense: Expense };

type Item =
  | { type: 'day'; key: string; day: string; net: number }
  | { type: 'row'; key: string; operation: Operation; divided: boolean };

export function OperationsScreen() {
  const { t } = useTranslation();
  const { period, range, userId, zone } = usePeriod();
  const ctx = useMoneyContext(userId);
  const periodName = usePeriodName();
  const sales = useSaleOperationsQuery(userId, range.from, range.to);
  const expenses = useExpensesRangeQuery(userId, period.startKey, period.endKey);
  const [filter, setFilter] = useState<Filter>('all');
  const refreshControl = useRefreshControl(() => Promise.all([sales.refetch(), expenses.refetch()]));

  const income = (sales.data ?? []).reduce((sum, s) => sum + s.amount, 0);
  const spent = (expenses.data ?? []).reduce((sum, e) => sum + e.amount, 0);

  const items = useMemo(() => {
    const operations: Operation[] = [
      ...(filter === 'out' ? [] : (sales.data ?? [])).map((sale): Operation => ({
        type: 'sale',
        day: DateTime.fromISO(sale.paid_at, { zone }).toISODate()!,
        sort: sale.paid_at,
        sale,
      })),
      ...(filter === 'in' ? [] : (expenses.data ?? [])).map((expense): Operation => ({
        type: 'expense',
        day: expense.spent_on,
        sort: expense.created_at,
        expense,
      })),
    ].sort((a, b) => b.day.localeCompare(a.day) || b.sort.localeCompare(a.sort));

    const out: Item[] = [];
    let index = 0;
    while (index < operations.length) {
      const day = operations[index]!.day;
      const rows = operations.filter((o) => o.day === day);
      const net = rows.reduce(
        (sum, o) => sum + (o.type === 'sale' ? o.sale.amount : -o.expense.amount),
        0,
      );
      out.push({ type: 'day', key: `day-${day}`, day, net });
      rows.forEach((operation, i) =>
        out.push({
          type: 'row',
          key: operation.type === 'sale' ? operation.sale.id : operation.expense.id,
          operation,
          divided: i > 0,
        }),
      );
      index += rows.length;
    }
    return out;
  }, [sales.data, expenses.data, filter, zone]);

  const weekdays = t('weekdays.long', { returnObjects: true }) as string[];
  const genitive = t('monthsGenitive', { returnObjects: true }) as string[];
  const dayTitle = (key: string) => {
    const date = DateTime.fromISO(key, { zone: 'utc' });
    return `${date.day} ${genitive[date.month - 1]}, ${weekdays[date.weekday - 1]?.toLowerCase()}`;
  };
  const methodLabel = (sale: SaleOperation) => {
    const method = sale.payment_type;
    if (!method) return null;
    return method.kind === 'custom'
      ? method.name
      : t(`checkout.methods.${method.kind}`, { defaultValue: method.name });
  };

  const error = sales.error ?? expenses.error;
  const pending = sales.isPending || expenses.isPending;

  const header = (
    <View>
      <Text variant="footnote" color="secondary" align="center">
        {periodName(period)}
      </Text>
      <View style={styles.totals}>
        <View style={styles.total}>
          <Text variant="caption" color="secondary">
            {t('money.income')}
          </Text>
          <Text variant="stat" color={income > 0 ? 'success' : 'primary'} tabularNums numberOfLines={1} adjustsFontSizeToFit>
            {`${income > 0 ? '+' : ''}${ctx.money(income)}`}
          </Text>
        </View>
        <View style={styles.total}>
          <Text variant="caption" color="secondary">
            {t('money.expenses')}
          </Text>
          <Text variant="stat" tabularNums numberOfLines={1} adjustsFontSizeToFit>
            {`${spent > 0 ? '−' : ''}${ctx.money(spent)}`}
          </Text>
        </View>
      </View>
      <View style={styles.chips}>
        {FILTERS.map((item) => (
          <Chip
            key={item}
            shape="pill"
            label={t(`money.operations.filter.${item}`)}
            selected={filter === item}
            onPress={() => setFilter(item)}
          />
        ))}
      </View>
    </View>
  );

  return (
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
        error ? (
          <ErrorState
            message={t(errorMessageKey(normalizeError(error)))}
            onRetry={() => {
              void sales.refetch();
              void expenses.refetch();
            }}
          />
        ) : pending ? (
          <View style={styles.loading}>
            <SkeletonList />
          </View>
        ) : (
          <EmptyState icon="receipt" title={t('money.operations.empty')} />
        )
      }
      renderItem={({ item }) => {
        if (item.type === 'day') {
          return (
            <View style={styles.dayHeader}>
              <Text variant="footnoteStrong">{dayTitle(item.day)}</Text>
              <Text variant="caption" color="tertiary" tabularNums>
                {`${item.net < 0 ? '−' : '+'}${ctx.money(Math.abs(item.net))}`}
              </Text>
            </View>
          );
        }
        const { operation } = item;
        if (operation.type === 'expense') {
          return (
            <ExpenseRow
              expense={operation.expense}
              amount={ctx.money(operation.expense.amount)}
              divided={item.divided}
            />
          );
        }
        const { sale } = operation;
        const name = [sale.client?.first_name, sale.client?.last_name].filter(Boolean).join(' ');
        const subtitle = [
          sale.items.map((i) => i.name_snapshot).join(' + '),
          methodLabel(sale),
          sale.tip > 0 ? t('money.operations.tip', { amount: ctx.money(sale.tip) }) : null,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/appointment/${sale.appointment_id}`)}
            style={[styles.row, item.divided && styles.divided]}>
            <Avatar name={name} color={sale.client?.avatar_color} size="sm" />
            <View style={styles.rowBody}>
              <Text variant="subheadStrong" numberOfLines={1}>
                {name}
              </Text>
              {subtitle ? (
                <Text variant="caption" color="tertiary" numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Text variant="subheadStrong" color="success" tabularNums>
              {`+${ctx.money(sale.amount)}`}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: {
    paddingTop: theme.space[2],
    paddingHorizontal: theme.space[5],
    paddingBottom: theme.space[10],
  },
  totals: { marginTop: theme.space[3], flexDirection: 'row', gap: theme.space[2] },
  total: {
    flex: 1,
    gap: 2,
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.bg.surface,
  },
  chips: { marginTop: theme.space[3.5], flexDirection: 'row', gap: theme.space[1.5] },
  loading: { marginTop: theme.space[5] },
  dayHeader: {
    marginTop: theme.space[5],
    marginBottom: theme.space[1.5],
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  divided: { borderTopWidth: 1, borderTopColor: theme.colors.bg.sunken },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
}));
