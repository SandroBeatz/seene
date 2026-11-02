/** One expense as a row (design "Операции"): receipt, category, what was bought, sum. */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { Expense } from '@/entities/expense';
import { Icon, Text } from '@/shared/ui';

export interface ExpenseRowProps {
  expense: Expense;
  amount: string;
  divided: boolean;
}

export function ExpenseRow({ expense, amount, divided }: ExpenseRowProps) {
  const { t } = useTranslation();
  const subtitle = [expense.note, expense.repeat_monthly ? t('expenses.repeatOn') : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/expense/${expense.id}`)}
      style={[styles.row, divided && styles.divided]}>
      <View style={styles.badge}>
        <Icon name="receipt" size="sm" color="content.secondary" />
      </View>
      <View style={styles.body}>
        <Text variant="subheadStrong" numberOfLines={1}>
          {t(`expenses.categoryNames.${expense.category}`)}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="tertiary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text variant="subheadStrong" tabularNums>
        {`−${amount}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  divided: { borderTopWidth: 1, borderTopColor: theme.colors.bg.sunken },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.sunken,
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
}));
