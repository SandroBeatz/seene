/**
 * Expense hooks. Every write also refreshes `['analytics', userId]`: "Аналитика" shows
 * expenses, and this entity can't import that one.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  createExpense,
  createExpenseCategory,
  deleteExpense,
  getExpense,
  listExpenseCategories,
  listExpenses,
  updateExpense,
} from '../api/expense.api';
import type { ExpenseInput, UpdateExpenseDto } from './types';

export const expenseKeys = {
  all: (userId: string) => ['expenses', userId] as const,
  range: (userId: string, fromKey: string, toKey: string) =>
    ['expenses', userId, 'range', fromKey, toKey] as const,
  detail: (userId: string, id: string) => ['expenses', userId, 'detail', id] as const,
  categories: (userId: string) => ['expenses', userId, 'categories'] as const,
};

function invalidate(qc: QueryClient, userId: string) {
  qc.invalidateQueries({ queryKey: expenseKeys.all(userId) });
  qc.invalidateQueries({ queryKey: ['analytics', userId] });
}

export function useExpensesRangeQuery(userId: string, fromKey: string, toKey: string) {
  return useQuery({
    queryKey: expenseKeys.range(userId, fromKey, toKey),
    queryFn: () => listExpenses(userId, fromKey, toKey),
    enabled: !!userId && !!fromKey && !!toKey,
  });
}

export function useExpenseQuery(userId: string, id: string | undefined) {
  return useQuery({
    queryKey: expenseKeys.detail(userId, id ?? ''),
    queryFn: () => getExpense(id!),
    enabled: !!userId && !!id,
  });
}

export function useExpenseCategoriesQuery(userId: string) {
  return useQuery({
    queryKey: expenseKeys.categories(userId),
    queryFn: () => listExpenseCategories(userId),
    enabled: !!userId,
  });
}

export function useCreateExpenseCategoryMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createExpenseCategory(userId, name),
    onSettled: () => qc.invalidateQueries({ queryKey: expenseKeys.categories(userId) }),
  });
}

export function useCreateExpenseMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(userId, input),
    onSettled: () => invalidate(qc, userId),
  });
}

export function useUpdateExpenseMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateExpenseDto) => updateExpense(dto),
    onSettled: () => invalidate(qc, userId),
  });
}

export function useDeleteExpenseMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSettled: () => invalidate(qc, userId),
  });
}
