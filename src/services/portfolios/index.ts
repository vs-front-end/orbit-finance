import { z } from 'zod';

import {
  fixedIncomeSchema,
  incomeSchema,
  portfolioSchema,
  transactionSchema,
  watchItemSchema,
  type Currency,
  type FixedIncome,
  type Income,
  type Portfolio,
  type PortfolioKind,
  type Transaction,
  type TransactionSide,
  type WatchItem,
} from '@/domain';

import { supabase } from '../supabase';

export type NewPortfolio = {
  name: string;
  kind: PortfolioKind;
  currency: Currency;
};

export type NewTransaction = {
  portfolioId: string;
  ticker: string;
  side: TransactionSide;
  quantity: number;
  unitPrice: number;
  executedAt: string;
};

export type UpdateTransaction = {
  side: TransactionSide;
  quantity: number;
  unitPrice: number;
  executedAt: string;
};

export type NewIncome = {
  portfolioId: string;
  ticker: string;
  amount: number;
  receivedAt: string;
};

export type NewFixedIncome = {
  portfolioId: string;
  name: string;
  principal: number;
  currentValue: number;
  appliedAt: string;
  maturesAt: string | null;
};

export type PortfoliosService = {
  list: () => Promise<Portfolio[]>;
  get: (id: string) => Promise<Portfolio | null>;
  create: (input: NewPortfolio) => Promise<Portfolio>;
  rename: (id: string, name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  listTransactions: (portfolioId: string) => Promise<Transaction[]>;
  listAllTransactions: () => Promise<Transaction[]>;
  addTransaction: (input: NewTransaction) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    input: UpdateTransaction,
  ) => Promise<Transaction>;
  removeTransaction: (id: string) => Promise<void>;
  removePosition: (portfolioId: string, ticker: string) => Promise<void>;
  listWatchItems: (portfolioId: string) => Promise<WatchItem[]>;
  addWatchItem: (portfolioId: string, ticker: string) => Promise<WatchItem>;
  removeWatchItem: (id: string) => Promise<void>;
  listIncomes: (portfolioId: string) => Promise<Income[]>;
  addIncome: (input: NewIncome) => Promise<Income>;
  removeIncome: (id: string) => Promise<void>;
  listFixedIncomes: (portfolioId: string) => Promise<FixedIncome[]>;
  listAllFixedIncomes: () => Promise<FixedIncome[]>;
  addFixedIncome: (input: NewFixedIncome) => Promise<FixedIncome>;
  updateFixedIncomeValue: (id: string, currentValue: number) => Promise<void>;
  removeFixedIncome: (id: string) => Promise<void>;
};

function unwrap<T>(result: {
  data: T | null;
  error: { message: string } | null;
}): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export const portfoliosService: PortfoliosService = {
  async list() {
    const rows = unwrap(
      await supabase.from('portfolios').select('*').order('createdAt'),
    );
    return z.array(portfolioSchema).parse(rows);
  },

  async get(id) {
    const row = unwrap(
      await supabase.from('portfolios').select('*').eq('id', id).maybeSingle(),
    );
    return row ? portfolioSchema.parse(row) : null;
  },

  async create(input) {
    const portfolio = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    const row = unwrap(
      await supabase.from('portfolios').insert(portfolio).select().single(),
    );
    return portfolioSchema.parse(row);
  },

  async rename(id, name) {
    unwrap(
      await supabase.from('portfolios').update({ name }).eq('id', id).select(),
    );
  },

  async remove(id) {
    await Promise.all([
      supabase.from('transactions').delete().eq('portfolioId', id),
      supabase.from('watch_items').delete().eq('portfolioId', id),
      supabase.from('incomes').delete().eq('portfolioId', id),
      supabase.from('fixed_incomes').delete().eq('portfolioId', id),
    ]);
    unwrap(await supabase.from('portfolios').delete().eq('id', id).select());
  },

  async listTransactions(portfolioId) {
    const rows = unwrap(
      await supabase
        .from('transactions')
        .select('*')
        .eq('portfolioId', portfolioId),
    );
    return z.array(transactionSchema).parse(rows);
  },

  async listAllTransactions() {
    const rows = unwrap(await supabase.from('transactions').select('*'));
    return z.array(transactionSchema).parse(rows);
  },

  async addTransaction(input) {
    const transaction = { id: crypto.randomUUID(), ...input };
    const row = unwrap(
      await supabase.from('transactions').insert(transaction).select().single(),
    );
    return transactionSchema.parse(row);
  },

  async updateTransaction(id, input) {
    const row = unwrap(
      await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
        .select()
        .single(),
    );
    return transactionSchema.parse(row);
  },

  async removeTransaction(id) {
    unwrap(await supabase.from('transactions').delete().eq('id', id).select());
  },

  async removePosition(portfolioId, ticker) {
    unwrap(
      await supabase
        .from('transactions')
        .delete()
        .eq('portfolioId', portfolioId)
        .eq('ticker', ticker)
        .select(),
    );
  },

  async listWatchItems(portfolioId) {
    const rows = unwrap(
      await supabase
        .from('watch_items')
        .select('*')
        .eq('portfolioId', portfolioId),
    );
    return z.array(watchItemSchema).parse(rows);
  },

  async addWatchItem(portfolioId, ticker) {
    const item = {
      id: crypto.randomUUID(),
      portfolioId,
      ticker: ticker.toUpperCase(),
      addedAt: new Date().toISOString(),
    };
    const row = unwrap(
      await supabase.from('watch_items').insert(item).select().single(),
    );
    return watchItemSchema.parse(row);
  },

  async removeWatchItem(id) {
    unwrap(await supabase.from('watch_items').delete().eq('id', id).select());
  },

  async listIncomes(portfolioId) {
    const rows = unwrap(
      await supabase.from('incomes').select('*').eq('portfolioId', portfolioId),
    );
    return z.array(incomeSchema).parse(rows);
  },

  async addIncome(input) {
    const income = { id: crypto.randomUUID(), ...input };
    const row = unwrap(
      await supabase.from('incomes').insert(income).select().single(),
    );
    return incomeSchema.parse(row);
  },

  async removeIncome(id) {
    unwrap(await supabase.from('incomes').delete().eq('id', id).select());
  },

  async listFixedIncomes(portfolioId) {
    const rows = unwrap(
      await supabase
        .from('fixed_incomes')
        .select('*')
        .eq('portfolioId', portfolioId),
    );
    return z.array(fixedIncomeSchema).parse(rows);
  },

  async listAllFixedIncomes() {
    const rows = unwrap(await supabase.from('fixed_incomes').select('*'));
    return z.array(fixedIncomeSchema).parse(rows);
  },

  async addFixedIncome(input) {
    const item = {
      id: crypto.randomUUID(),
      ...input,
      cdiPercent: 100,
    };
    const row = unwrap(
      await supabase.from('fixed_incomes').insert(item).select().single(),
    );
    return fixedIncomeSchema.parse(row);
  },

  async updateFixedIncomeValue(id, currentValue) {
    unwrap(
      await supabase
        .from('fixed_incomes')
        .update({ currentValue })
        .eq('id', id)
        .select(),
    );
  },

  async removeFixedIncome(id) {
    unwrap(await supabase.from('fixed_incomes').delete().eq('id', id).select());
  },
};
