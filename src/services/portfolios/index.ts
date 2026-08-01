import { z } from 'zod';

import {
  portfolioSchema,
  transactionSchema,
  type Currency,
  type Portfolio,
  type Transaction,
  type TransactionSide,
} from '@/domain';

import { supabase } from '../supabase';

export type NewPortfolio = {
  name: string;
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
      await supabase
        .from('portfolios')
        .select('*')
        .eq('kind', 'investment')
        .order('createdAt'),
    );
    return z.array(portfolioSchema).parse(rows);
  },

  async get(id) {
    const row = unwrap(
      await supabase
        .from('portfolios')
        .select('*')
        .eq('id', id)
        .eq('kind', 'investment')
        .maybeSingle(),
    );
    return row ? portfolioSchema.parse(row) : null;
  },

  async create(input) {
    const portfolio = {
      id: crypto.randomUUID(),
      ...input,
      kind: 'investment',
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
    await supabase.from('transactions').delete().eq('portfolioId', id);
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
};
