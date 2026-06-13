# Orbit Finance

Personal finance hub. **Investments** module: portfolios, positions, P/L, allocation,
dividends, fixed income (manual value), evolution stats, and other assets outside portfolios.
**Tools**: CDB/CDI simulator, compound interest, rebalancing.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run lint       # eslint + prettier (--fix)
```

GitHub auth via Supabase. Data in Supabase. Quotes via Yahoo (Edge Function).

## Data sources

| Data | Source |
|---|---|
| B3, US, crypto quotes | Yahoo via `supabase/functions/quotes-us` |
| Asset search | Yahoo (same function) + CoinGecko (crypto) |
| USD/BRL | AwesomeAPI |
| CDI | BCB/SGS (CDB simulator only) |
| Fixed income in portfolio | Manual `currentValue` |
| Benchmarks (Ibovespa, S&P 500) | Yahoo via `quotes-us` (`indexDays`) |

Copy `.env.example` to `.env.local` and fill in Supabase vars.

## Structure

```
src/
  domain/      types, zod, position/P&L math (pure)
  services/    auth, portfolios, assets, quotes, history, targets, cdi, patrimony
  hooks/       TanStack Query
  screens/     pages + local components
  routes/      TanStack Router (file-based)
supabase/
  schema.sql
  functions/quotes-us/
```

## Supabase setup

Apply `supabase/schema.sql` on a fresh project.

If `fixed_incomes` already existed without `currentValue`:

```sql
alter table fixed_incomes add column if not exists "currentValue" double precision;
update fixed_incomes set "currentValue" = principal where "currentValue" is null;
alter table fixed_incomes alter column "currentValue" set not null;
```

Deploy the Edge Function after pulling:

```bash
supabase functions deploy quotes-us --project-ref <your-project-ref>
```
