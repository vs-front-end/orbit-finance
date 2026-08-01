import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import {
  portfoliosService,
  targetsService,
  type AllocationTargets,
  type NewPortfolio,
  type NewTransaction,
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

export function useSetTargets() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (targets: AllocationTargets) =>
      targetsService.setTargets(targets),
    onSuccess: () => invalidate([queryKeys.targets]),
  });
}
