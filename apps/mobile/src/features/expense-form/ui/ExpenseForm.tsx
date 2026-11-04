/**
 * "Новый расход" (design "Аналитика · «Добавить расход»", "… расход, своя категория"): the
 * amount typed on the screen's own number pad, the categories with "+ Своя" first, then
 * date, note and "Повторять каждый месяц" in one group. A native sheet; deleting an
 * existing expense is in the bar's native menu. While a text field is focused the system
 * keyboard takes the pad's place.
 *
 * Only the newest row of a monthly chain can stop it: a month that already rolled
 * over shows that it repeats, without the switch.
 */
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Alert, Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  EXPENSE_CATEGORIES,
  expenseCategoryLabel,
  useCreateExpenseCategoryMutation,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useExpenseCategoriesQuery,
  useUpdateExpenseMutation,
  type Expense,
} from '@/entities/expense';
import { useMoneyContext } from '@/entities/master';
import { useUserId } from '@/entities/session';
import {
  Button,
  Chip,
  Icon,
  MonthGrid,
  NumberPad,
  SheetChrome,
  Switch,
  Text,
  useNow,
  showFailedToast,
  showToast,
} from '@/shared/ui';
import { addDigits, eraseDigit } from '../model/amountKeys';

const NOTE_MAX_LENGTH = 200;
const CATEGORY_MAX_LENGTH = 40;

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
  const customCategories = useExpenseCategoriesQuery(userId);
  const createCategory = useCreateExpenseCategoryMutation(userId);

  const todayKey = DateTime.fromMillis(now, { zone: money.zone }).toISODate()!;
  // Null until typed in: the stored sum may have kopecks, which digits can't hold.
  const [digits, setDigits] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(expense?.category ?? EXPENSE_CATEGORIES[0]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [typing, setTyping] = useState(false);
  const chipsRef = useRef<ScrollView>(null);
  const [day, setDay] = useState(expense?.spent_on ?? initialDay ?? todayKey);
  const [note, setNote] = useState(expense?.note ?? '');
  const [repeat, setRepeat] = useState(expense?.repeat_monthly ?? false);
  const [dateOpen, setDateOpen] = useState(false);

  const monthsGenitive = t('monthsGenitive', { returnObjects: true }) as string[];
  const parsed = DateTime.fromISO(day, { zone: 'utc' });
  const dayLabel = `${parsed.day} ${monthsGenitive[parsed.month - 1] ?? ''}`;
  const amount = digits === null ? (expense?.amount ?? 0) : Number(digits);
  const typedDigits = digits ?? (expense ? String(Math.trunc(expense.amount)) : '');
  const chips = [
    ...new Set<string>([
      ...EXPENSE_CATEGORIES,
      ...(customCategories.data ?? []).map((c) => c.name),
      category,
    ]),
  ];
  const chipLabel = (item: string) => expenseCategoryLabel(item, t, 'chip');
  const saving = create.isPending || update.isPending;

  const failed = () => showFailedToast();

  const save = () => {
    const input = {
      category,
      amount,
      spent_on: day,
      note: note.trim() || null,
      repeat_monthly: repeat,
    };
    const onError = () => showFailedToast(save);
    const label = expenseCategoryLabel(category, t, 'chip');
    if (expense) {
      update.mutate(
        { id: expense.id, ...input },
        {
          onSuccess: () => {
            showToast({ title: t('toasts.saved'), summary: label });
            router.back();
          },
          onError,
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: () => {
          showToast({
            title: t('toasts.expenseAdded', { amount: money.money(amount) }),
            summary: `${label} · ${day === todayKey ? t('toasts.today') : dayLabel}`,
          });
          router.back();
        },
        onError,
      });
    }
  };

  const pickCategory = (item: string) => {
    Keyboard.dismiss();
    setCategory(item);
    setAddingCategory(false);
    // The field goes away with its focus, and a removed field reports no blur.
    setTyping(false);
  };

  const saveCategory = () => {
    const name = categoryName.trim();
    if (!name) return;
    const done = (picked: string) => {
      pickCategory(picked);
      setCategoryName('');
    };
    const same = chips.find((c) => chipLabel(c).toLowerCase() === name.toLowerCase());
    if (same) return done(same);
    createCategory.mutate(name, {
      onSuccess: () => {
        done(name);
        chipsRef.current?.scrollToEnd();
      },
      onError: failed,
    });
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
          onPress: () =>
            remove.mutate(expense.id, { onSuccess: () => router.back(), onError: failed }),
        },
      ],
    );
  };

  return (
    // Kept as a real view: see CheckoutEditor (a direct ScrollView child gets pinned).
    <View style={styles.root} collapsable={false}>
      <SheetChrome
        spacer
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
      {/* Not "automatic" insets: this scroll view returns to 0, which would sit under the bar. */}
      <KeyboardAwareScrollView
        contentInsetAdjustmentBehavior="never"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <Pressable
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${t('expenses.amountA11y', { currency: money.currencyLabel })}: ${money.number(amount)}`}
          onPress={Keyboard.dismiss}
          style={styles.amountRow}>
          <Text variant="amount" color={amount > 0 ? 'primary' : 'disabled'} tabularNums>
            {money.number(amount)}
          </Text>
          <Text variant="title2" color="tertiary">
            {money.currencyLabel}
          </Text>
        </Pressable>

        <ScrollView
          ref={chipsRef}
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}>
          <Chip
            shape="pill"
            size="sm"
            dashed={!addingCategory}
            active={addingCategory}
            label={t('expenses.customCategory')}
            onPress={() => setAddingCategory(true)}
          />
          {chips.map((item) => (
            <Chip
              key={item}
              shape="pill"
              size="sm"
              label={chipLabel(item)}
              selected={category === item && !addingCategory}
              onPress={() => pickCategory(item)}
            />
          ))}
        </ScrollView>

        {addingCategory ? (
          <>
            <View style={styles.newCategory}>
              <TextInput
                accessibilityLabel={t('expenses.categoryNamePlaceholder')}
                autoFocus
                value={categoryName}
                onChangeText={setCategoryName}
                onSubmitEditing={saveCategory}
                onFocus={() => setTyping(true)}
                onBlur={() => setTyping(false)}
                maxLength={CATEGORY_MAX_LENGTH}
                returnKeyType="done"
                placeholder={t('expenses.categoryNamePlaceholder')}
                placeholderTextColor={theme.colors.content.tertiary}
                style={styles.categoryInput}
              />
              <Button
                size="md"
                label={t('common.save')}
                loading={createCategory.isPending}
                disabled={!categoryName.trim()}
                onPress={saveCategory}
              />
            </View>
            <Text variant="caption" color="tertiary" style={styles.categoryHint}>
              {t('expenses.categoryHint')}
            </Text>
          </>
        ) : null}

        <View style={styles.group}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: dateOpen }}
            onPress={() => setDateOpen((open) => !open)}
            style={styles.row}>
            <Text variant="body" style={styles.grow}>
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
            onFocus={() => setTyping(true)}
            onBlur={() => setTyping(false)}
            returnKeyType="done"
            style={styles.noteInput}
          />
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text variant="body" style={styles.grow}>
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
      </KeyboardAwareScrollView>

      <KeyboardStickyView
        offset={{ opened: insets.bottom - theme.space[3] }}
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {typing ? null : (
          <NumberPad
            onDigits={(added) => setDigits(addDigits(typedDigits, added))}
            onErase={() => setDigits(eraseDigit(typedDigits))}
            eraseLabel={t('expenses.erase')}
          />
        )}
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: theme.space[4], paddingBottom: theme.space[3] },
  amountRow: {
    marginTop: theme.space[1.5],
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: theme.space[2],
  },
  chipsScroll: { marginTop: theme.space[2.5], marginHorizontal: -theme.space[4], flexGrow: 0 },
  chips: { paddingHorizontal: theme.space[4], gap: theme.space[1.5] },
  newCategory: {
    marginTop: theme.space[2.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  categoryInput: {
    flex: 1,
    minWidth: 0,
    height: theme.sizing.control.md,
    paddingVertical: 0,
    paddingHorizontal: theme.space[3],
    borderWidth: 1.5,
    borderColor: theme.colors.accent.default,
    borderRadius: theme.radius.field,
    color: theme.colors.content.primary,
    ...theme.typography.body,
    lineHeight: undefined,
  },
  categoryHint: { marginTop: theme.space[1.5], paddingLeft: theme.space[1] },
  group: {
    marginTop: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.bg.surface,
  },
  row: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: theme.space[2.5] },
  grow: { flex: 1, minWidth: 0 },
  divider: { height: 1, backgroundColor: theme.colors.border.default },
  calendar: { paddingBottom: theme.space[2] },
  noteInput: {
    minHeight: 46,
    padding: 0,
    color: theme.colors.content.primary,
    ...theme.typography.body,
  },
  footer: {
    gap: theme.space[3],
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    backgroundColor: theme.colors.bg.elevated,
  },
}));
