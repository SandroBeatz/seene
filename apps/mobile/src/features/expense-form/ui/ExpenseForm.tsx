/**
 * "Новый расход" (design "Аналитика · «Добавить расход»"): the amount, the category,
 * then date, note and "Повторять каждый месяц" in one group. A native sheet; deleting
 * an existing expense is in the bar's native menu.
 *
 * Only the newest row of a monthly chain can stop it: a month that already rolled
 * over shows that it repeats, without the switch.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  EXPENSE_CATEGORIES,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useUpdateExpenseMutation,
  type Expense,
  type ExpenseCategory,
} from '@/entities/expense';
import { useMoneyContext } from '@/entities/master';
import { useUserId } from '@/entities/session';
import { Button, Chip, Icon, MonthGrid, SheetChrome, Switch, Text, useNow } from '@/shared/ui';

const NOTE_MAX_LENGTH = 200;

export interface ExpenseFormProps {
  /** Absent = a new expense. */
  expense?: Expense;
  /** A new expense's day, when opened from a past month. */
  initialDay?: string;
}

export function ExpenseForm({ expense, initialDay }: ExpenseFormProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const userId = useUserId() ?? '';
  const money = useMoneyContext(userId);
  const now = useNow();
  const create = useCreateExpenseMutation(userId);
  const update = useUpdateExpenseMutation(userId);
  const remove = useDeleteExpenseMutation(userId);

  const todayKey = DateTime.fromMillis(now, { zone: money.zone }).toISODate()!;
  const [amountInput, setAmountInput] = useState(expense ? money.number(expense.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? 'materials');
  const [day, setDay] = useState(expense?.spent_on ?? initialDay ?? todayKey);
  const [note, setNote] = useState(expense?.note ?? '');
  const [repeat, setRepeat] = useState(expense?.repeat_monthly ?? false);
  const [dateOpen, setDateOpen] = useState(false);

  const monthsGenitive = t('monthsGenitive', { returnObjects: true }) as string[];
  const parsed = DateTime.fromISO(day, { zone: 'utc' });
  const dayLabel = `${parsed.day} ${monthsGenitive[parsed.month - 1] ?? ''}`;
  const amount = Number(amountInput.replace(/[^\d]/g, ''));
  const saving = create.isPending || update.isPending;

  const failed = () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));
  const done = { onSuccess: () => router.back(), onError: failed };

  const save = () => {
    const input = {
      category,
      amount,
      spent_on: day,
      note: note.trim() || null,
      repeat_monthly: repeat,
    };
    if (expense) update.mutate({ id: expense.id, ...input }, done);
    else create.mutate(input, done);
  };

  const confirmDelete = () => {
    if (!expense) return;
    const stopsChain = expense.repeat_monthly && !expense.rolled_over;
    Alert.alert(
      t('expenses.deleteTitle'),
      stopsChain ? t('expenses.deleteRepeatText') : undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => remove.mutate(expense.id, done),
        },
      ],
    );
  };

  return (
    // Kept as a real view: see CheckoutEditor (a direct ScrollView child gets pinned).
    <View style={styles.root} collapsable={false}>
      <SheetChrome
        title={t(expense ? 'expenses.editTitle' : 'expenses.newTitle')}
        leadingLabel={t('common.close')}
        menu={
          expense
            ? {
                label: t('expenses.more'),
                cancelLabel: t('common.cancel'),
                items: [
                  {
                    key: 'delete',
                    label: t('common.delete'),
                    sf: 'trash',
                    icon: 'trash',
                    destructive: true,
                    onPress: confirmDelete,
                  },
                ],
              }
            : undefined
        }
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.amountRow}>
          <TextInput
            accessibilityLabel={t('expenses.amountA11y', { currency: money.currencyLabel })}
            autoFocus={!expense}
            value={amountInput}
            onChangeText={(text) => {
              const digits = text.replace(/[^\d]/g, '');
              setAmountInput(digits ? money.number(Number(digits)) : '');
            }}
            placeholder="0"
            placeholderTextColor={theme.colors.content.disabled}
            keyboardType="number-pad"
            style={styles.amountInput}
          />
          <Text variant="title2" color="tertiary">
            {money.currencyLabel}
          </Text>
        </View>

        <Text variant="captionMedium" color="secondary" style={styles.label}>
          {t('expenses.category')}
        </Text>
        <View style={styles.chips}>
          {EXPENSE_CATEGORIES.map((item) => (
            <Chip
              key={item}
              shape="pill"
              label={t(`expenses.categories.${item}`)}
              selected={category === item}
              onPress={() => setCategory(item)}
            />
          ))}
        </View>

        <View style={styles.group}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: dateOpen }}
            onPress={() => setDateOpen((open) => !open)}
            style={styles.row}>
            <Text variant="bodyLarge" style={styles.grow}>
              {t('expenses.date')}
            </Text>
            <Text variant="subhead" color="secondary" tabularNums>
              {day === todayKey ? t('expenses.todayDate', { date: dayLabel }) : dayLabel}
            </Text>
            <Icon
              name={dateOpen ? 'chevronDown' : 'chevronRight'}
              size="sm"
              color="content.tertiary"
            />
          </Pressable>
          {dateOpen ? (
            <View style={styles.calendar}>
              <MonthGrid
                start={day}
                end={day}
                maxKey={todayKey}
                onPick={(key) => {
                  setDay(key);
                  setDateOpen(false);
                }}
                monthNames={t('months', { returnObjects: true }) as string[]}
                weekdayNames={t('weekdays.short', { returnObjects: true }) as string[]}
                prevLabel={t('money.prevMonth')}
                nextLabel={t('money.nextMonth')}
              />
            </View>
          ) : null}
          <View style={styles.divider} />
          <TextInput
            accessibilityLabel={t('expenses.notePlaceholder')}
            value={note}
            onChangeText={setNote}
            maxLength={NOTE_MAX_LENGTH}
            placeholder={t('expenses.notePlaceholder')}
            placeholderTextColor={theme.colors.content.tertiary}
            style={styles.noteInput}
          />
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text variant="bodyLarge" style={styles.grow}>
              {t('expenses.repeat')}
            </Text>
            {expense?.rolled_over ? (
              <Text variant="subhead" color="secondary">
                {t('expenses.repeatOn')}
              </Text>
            ) : (
              <Switch
                value={repeat}
                onValueChange={setRepeat}
                accessibilityLabel={t('expenses.repeat')}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <KeyboardStickyView
        offset={{ opened: insets.bottom - theme.space[3] }}
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label={t(expense ? 'common.save' : 'expenses.add')}
          loading={saving}
          disabled={amount <= 0}
          onPress={save}
          fullWidth
        />
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  content: { paddingTop: theme.space[3.5], paddingHorizontal: theme.space[5] },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: theme.space[2],
  },
  amountInput: {
    minWidth: 60,
    padding: 0,
    textAlign: 'center',
    color: theme.colors.content.primary,
    ...theme.typography.amount,
    fontVariant: ['tabular-nums'],
  },
  label: { marginTop: theme.space[4.5], paddingLeft: theme.space[1] },
  chips: {
    marginTop: theme.space[2],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[1.5],
  },
  group: {
    marginTop: theme.space[4],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.bg.surface,
  },
  row: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: theme.space[2.5] },
  grow: { flex: 1, minWidth: 0 },
  divider: { height: 1, backgroundColor: theme.colors.border.default },
  calendar: { paddingBottom: theme.space[2] },
  noteInput: {
    minHeight: 50,
    padding: 0,
    color: theme.colors.content.primary,
    ...theme.typography.body,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[5],
    backgroundColor: theme.colors.bg.elevated,
  },
}));
