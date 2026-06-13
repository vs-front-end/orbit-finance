import { z } from 'zod';

const envSchema = z.object({
  VITE_COINGECKO_API_URL: z.url().default('https://api.coingecko.com/api/v3'),
  VITE_AWESOMEAPI_URL: z
    .url()
    .default('https://economia.awesomeapi.com.br/json'),
  VITE_BCB_SGS_URL: z.url().default('https://api.bcb.gov.br/dados/serie'),
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export const env = envSchema.parse(import.meta.env);
