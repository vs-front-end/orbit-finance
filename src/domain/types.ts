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

export const patrimonyKindSchema = z.enum([
  'cash',
  'reserve',
  'property',
  'vehicle',
]);

export const patrimonyItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  kind: patrimonyKindSchema,
  value: z.number().nonnegative(),
  referenceDate: z.string().nullable(),
  cdiPercent: z.number().nullable(),
  annualRate: z.number().nullable(),
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
export type AssetClass = z.infer<typeof assetClassSchema>;
export type PortfolioKind = z.infer<typeof portfolioKindSchema>;
export type TransactionSide = z.infer<typeof transactionSideSchema>;
export type Portfolio = z.infer<typeof portfolioSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type WatchItem = z.infer<typeof watchItemSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type PatrimonyKind = z.infer<typeof patrimonyKindSchema>;
export type PatrimonyItem = z.infer<typeof patrimonyItemSchema>;
export type AuthProvider = z.infer<typeof authProviderSchema>;
export type User = z.infer<typeof userSchema>;
