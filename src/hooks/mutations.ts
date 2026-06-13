import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import {
  patrimonyService,
  portfoliosService,
  targetsService,
  type AllocationTargets,
  type NewFixedIncome,
  type NewIncome,
  type NewPatrimonyItem,
  type NewPortfolio,
  type NewTransaction,
  type UpdatePatrimonyItem,
  type UpdateTransaction,
} from '@/services';

import { queryKeys } from './queries';

function useInvalidate() {
  const queryClient = useQueryClient();
  return (keys: readonly (readonly string[])[]) =>
    Promise.all(
      keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
}

export function useCreatePortfolio() {
  const invalidate = useInvalidate();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: NewPortfolio) => portfoliosService.create(input),
    onSuccess: async (portfolio) => {
      await invalidate([queryKeys.portfolios]);
      await navigate({
        to: '/carteiras/$portfolioId',
        params: { portfolioId: portfolio.id },
      });
    },
  });
}

export function useRenamePortfolio() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      portfoliosService.rename(id, name),
    onSuccess: () => invalidate([queryKeys.portfolios]),
  });
}

export function useRemovePortfolio() {
  const invalidate = useInvalidate();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: string) => portfoliosService.remove(id),
    onSuccess: async () => {
      await invalidate([queryKeys.portfolios, queryKeys.allTransactions]);
      await navigate({ to: '/' });
    },
  });
}

export function useAddTransaction() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: NewTransaction) =>
      portfoliosService.addTransaction(input),
    onSuccess: (_, input) =>
      invalidate([
        queryKeys.allTransactions,
        queryKeys.transactions(input.portfolioId),
      ]),
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransaction }) =>
      portfoliosService.updateTransaction(id, input),
    onSuccess: (transaction) =>
      invalidate([
        queryKeys.allTransactions,
        queryKeys.transactions(transaction.portfolioId),
      ]),
  });
}

export function useRemoveTransaction() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (id: string) => portfoliosService.removeTransaction(id),
    onSuccess: () => invalidate([queryKeys.allTransactions]),
  });
}

export function useRemovePosition() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({
      portfolioId,
      ticker,
    }: {
      portfolioId: string;
      ticker: string;
    }) => portfoliosService.removePosition(portfolioId, ticker),
    onSuccess: () => invalidate([queryKeys.allTransactions]),
  });
}

export function useAddIncome() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: NewIncome) => portfoliosService.addIncome(input),
    onSuccess: (income) => invalidate([queryKeys.incomes(income.portfolioId)]),
  });
}

export function useRemoveIncome(portfolioId: string) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (id: string) => portfoliosService.removeIncome(id),
    onSuccess: () => invalidate([queryKeys.incomes(portfolioId)]),
  });
}

export function useAddFixedIncome() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: NewFixedIncome) =>
      portfoliosService.addFixedIncome(input),
    onSuccess: () => invalidate([queryKeys.allFixedIncomes]),
  });
}

export function useRemoveFixedIncome() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (id: string) => portfoliosService.removeFixedIncome(id),
    onSuccess: () => invalidate([queryKeys.allFixedIncomes]),
  });
}

export function useUpdateFixedIncomeValue(portfolioId: string) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: number }) =>
      portfoliosService.updateFixedIncomeValue(id, currentValue),
    onSuccess: () =>
      invalidate([
        queryKeys.allFixedIncomes,
        queryKeys.fixedIncomes(portfolioId),
      ]),
  });
}

export function useSetTargets() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (targets: AllocationTargets) =>
      targetsService.setTargets(targets),
    onSuccess: () => invalidate([queryKeys.targets]),
  });
}

export function useAddWatchItem() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({
      portfolioId,
      ticker,
    }: {
      portfolioId: string;
      ticker: string;
    }) => portfoliosService.addWatchItem(portfolioId, ticker),
    onSuccess: (item) => invalidate([queryKeys.watchItems(item.portfolioId)]),
  });
}

export function useRemoveWatchItem(portfolioId: string) {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (id: string) => portfoliosService.removeWatchItem(id),
    onSuccess: () => invalidate([queryKeys.watchItems(portfolioId)]),
  });
}

export function useAddPatrimonyItem() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: NewPatrimonyItem) => patrimonyService.add(input),
    onSuccess: () => invalidate([queryKeys.patrimonyItems]),
  });
}

export function useUpdatePatrimonyItem() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePatrimonyItem }) =>
      patrimonyService.update(id, input),
    onSuccess: () => invalidate([queryKeys.patrimonyItems]),
  });
}

export function useRemovePatrimonyItem() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (id: string) => patrimonyService.remove(id),
    onSuccess: () => invalidate([queryKeys.patrimonyItems]),
  });
}
