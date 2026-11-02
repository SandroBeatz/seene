import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useExpenseQuery, type Expense } from '@/entities/expense';
import { useUserId } from '@/entities/session';
import { ExpenseForm } from '@/features/expense-form';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { ErrorState, Screen, Skeleton } from '@/shared/ui';

export default function EditExpenseRoute() {
  const { t } = useTranslation();
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const expense = useExpenseQuery(useUserId() ?? '', expenseId);
  if (!expense.data) {
    return (
      <Screen>
        {expense.isError ? (
          <ErrorState
            message={t(errorMessageKey(normalizeError(expense.error)))}
            onRetry={() => void expense.refetch()}
          />
        ) : (
          <Skeleton height={320} />
        )}
      </Screen>
    );
  }
  return <ExpenseForm expense={expense.data as Expense} />;
}
