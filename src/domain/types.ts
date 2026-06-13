import { z } from 'zod';

export const currencySchema = z.enum(['BRL', 'USD']);
export const assetClassSchema = z.enum([
  'stock-br',
  'fii',
  'stock-us',
  'crypto',
]);
export const portfolioKindSchema = z.enum(['investment', 'watchlist']);
export const transactionSideSchema = z.enum(['buy', 'sell']);

export const portfolioSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  kind: portfolioKindSchema,
  currency: currencySchema,
  createdAt: z.iso.datetime(),
});

export const transactionSchema = z.object({
  id: z.string(),
  portfolioId: z.string(),
  ticker: z.string().min(1),
  side: transactionSideSchema,
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  executedAt: z.iso.datetime(),
});

export const watchItemSchema = z.object({
  id: z.string(),
  portfolioId: z.string(),
  ticker: z.string().min(1),
  addedAt: z.iso.datetime(),
});

export const assetSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  assetClass: assetClassSchema,
  sector: z.string(),
  currency: currencySchema,
});

export const quoteSchema = z.object({
  ticker: z.string(),
  price: z.number(),
  previousClose: z.number(),
  updatedAt: z.iso.datetime(),
});

export const incomeSchema = z.object({
  id: z.string(),
  portfolioId: z.string(),
  ticker: z.string().min(1),
  amount: z.number().positive(),
  receivedAt: z.iso.datetime(),
});

export const fixedIncomeSchema = z
  .object({
    id: z.string(),
    portfolioId: z.string(),
    name: z.string().min(1),
    principal: z.number().positive(),
    currentValue: z.number().positive().optional(),
    cdiPercent: z.number().positive(),
    appliedAt: z.iso.datetime(),
    maturesAt: z.iso.datetime().nullable(),
  })
  .transform((item) => ({
    ...item,
    currentValue: item.currentValue ?? item.principal,
  }));

export const patrimonyItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  value: z.number().nonnegative(),
  createdAt: z.iso.datetime(),
});

export const authProviderSchema = z.enum(['github']);

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  provider: authProviderSchema,
});

export type Currency = z.infer<typeof currencySchema>;
export type PortfolioKind = z.infer<typeof portfolioKindSchema>;
export type TransactionSide = z.infer<typeof transactionSideSchema>;
export type Portfolio = z.infer<typeof portfolioSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type WatchItem = z.infer<typeof watchItemSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type Income = z.infer<typeof incomeSchema>;
export type FixedIncome = z.infer<typeof fixedIncomeSchema>;
export type PatrimonyItem = z.infer<typeof patrimonyItemSchema>;
export type AuthProvider = z.infer<typeof authProviderSchema>;
export type User = z.infer<typeof userSchema>;
