-- Orbit Finance — schema do módulo Investimentos.
-- Colunas em camelCase (casam com os tipos de src/domain). Datas como text (ISO
-- com sufixo Z, igual ao que o app gera) para preservar o round-trip. Valores
-- monetários como double precision (PostgREST devolve number, não string).
-- Cada linha pertence a um usuário (user_id = auth.uid()), isolada via RLS.

create table if not exists portfolios (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  kind        text not null,
  currency    text not null,
  "createdAt" text not null
);

create table if not exists transactions (
  id            text primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  "portfolioId" text not null,
  ticker        text not null,
  side          text not null,
  quantity      double precision not null,
  "unitPrice"   double precision not null,
  "executedAt"  text not null
);

-- Catálogo de ativos que o usuário já usou (alimentado pela busca real ao
-- registrar transações). Guarda os metadados — classe, setor, moeda — que
-- roteiam a cotação e classificam a alocação de qualquer ticker.
create table if not exists assets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ticker       text not null,
  name         text not null,
  "assetClass" text not null,
  sector       text not null,
  currency     text not null,
  unique (user_id, ticker)
);

-- Snapshot diário do valor de mercado por carteira (moeda nativa). Um por dia
-- por carteira (id = portfolioId-data), usado pelos gráficos da Dashboard.
create table if not exists portfolio_snapshots (
  id            text primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  "portfolioId" text not null,
  date          text not null,
  value         double precision not null,
  currency      text not null
);

-- Provento já apurado e congelado (id = portfolioId-ticker-dataEx). O Yahoo só
-- devolve os últimos anos e a B3 só uns 12 meses, então o que é apurado
-- enquanto as fontes têm o registro fica gravado aqui e vira a verdade.
-- editedManually protege a linha de ser reescrita pela apuração automática.
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

create index if not exists transactions_portfolio_idx on transactions ("portfolioId");
create index if not exists portfolio_snapshots_date_idx on portfolio_snapshots (date);
create index if not exists dividends_portfolio_idx on dividends ("portfolioId");
create index if not exists dividends_payment_idx on dividends ("paymentDate");
-- RLS: cada usuário só enxerga e altera as próprias linhas.
do $$
declare
  t text;
begin
  foreach t in array array['portfolios', 'transactions', 'portfolio_snapshots', 'assets', 'dividends']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists owner_all on %I', t);
    execute format(
      'create policy owner_all on %I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;
