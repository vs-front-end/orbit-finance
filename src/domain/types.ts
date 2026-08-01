import { z } from 'zod';

export const currencySchema = z.enum(['BRL', 'USD']);

export const assetClassSchema = z.enum([
  'stock-br',
  'fii',
  'stock-us',
  'crypto',
]);

export const transactionSideSchema = z.enum(['buy', 'sell']);

export const portfolioSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
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

export const authProviderSchema = z.enum(['github', 'google']);

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  provider: authProviderSchema,
});

export type Currency = z.infer<typeof currencySchema>;
export type AssetClass = z.infer<typeof assetClassSchema>;
export type TransactionSide = z.infer<typeof transactionSideSchema>;
export type Portfolio = z.infer<typeof portfolioSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type AuthProvider = z.infer<typeof authProviderSchema>;
export type User = z.infer<typeof userSchema>;
