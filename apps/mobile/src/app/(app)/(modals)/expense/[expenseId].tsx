import { useLocalSearchParams } from 'expo-router';
import { useExpenseQuery, type Expense } from '@/entities/expense';
import { useUserId } from '@/entities/session';
import { ExpenseForm } from '@/features/expense-form';
import { Screen, Skeleton } from '@/shared/ui';

export default function EditExpenseRoute() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const expense = useExpenseQuery(useUserId() ?? '', expenseId);
  if (!expense.data) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  return <ExpenseForm expense={expense.data as Expense} />;
}
