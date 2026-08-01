# Orbit Finance

Personal finance hub. **Investments** module: portfolios, positions, P/L,
automatic dividends and evolution charts.
**Tool**: portfolio rebalancing.

UI built with [Stellar UI Kit](https://stellar.vsdev.app).

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
| Fixed income in portfolio | Manual `currentValue` |
| Dividends / proventos | Yahoo via `quotes-us` (`dividends`), per-share × held quantity on the ex-date |

Copy `.env.example` to `.env.local` and fill in Supabase vars.

## Structure

```
src/
  domain/      types, zod, position/P&L math (pure)
  services/    auth, portfolios, assets, quotes, history, targets
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

Para adicionar a tabela de proventos num projeto que já existia:

```sql
create table if not exists dividends (
  id               text primary key,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  "portfolioId"    text not null,
  ticker           text not null,
  "exDate"         text not null,
  "paymentDate"    text not null,
  label            text not null default '',
  "amountPerShare" double precision not null,
  quantity         double precision not null,
  gross            double precision not null,
  tax              double precision not null,
  received         double precision not null,
  currency         text not null,
  "estimatedPayment" boolean not null default false,
  "editedManually" boolean not null default false
);

create index if not exists dividends_portfolio_idx on dividends ("portfolioId");
create index if not exists dividends_payment_idx on dividends ("paymentDate");

alter table dividends enable row level security;
drop policy if exists owner_all on dividends;
create policy owner_all on dividends for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Deploy the Edge Function after pulling:

```bash
supabase functions deploy quotes-us --project-ref <your-project-ref>
```
