import { useLocalSearchParams } from 'expo-router';
import { ExpenseForm } from '@/features/expense-form';

export default function NewExpenseRoute() {
  const { day } = useLocalSearchParams<{ day?: string }>();
  return <ExpenseForm initialDay={day} />;
}
