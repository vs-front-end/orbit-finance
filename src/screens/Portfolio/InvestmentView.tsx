import { useState } from 'react';

import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@stellar-ui-kit/web';

import { Plus } from 'lucide-react';

import {
  type Portfolio,
  type Transaction,
  type TransactionSide,
} from '@/domain';
import { usePortfolioPositions } from '@/hooks';
import { formatMoney } from '@/utils';

import { PLValue, RefreshIndicator, StatCard } from '@/components';

import { TransactionDialog } from './TransactionDialog';
import { IncomesTab } from './IncomesTab';
import { PortfolioActions } from './PortfolioActions';
import { PortfolioHeader } from './PortfolioHeader';
import { PortfolioSkeleton } from './PortfolioSkeleton';
import { PositionsTable } from './PositionsTable';
import { TransactionsTable } from './TransactionsTable';

type TransactionDraft = { ticker?: string; side?: TransactionSide };

export function InvestmentView({ portfolio }: { portfolio: Portfolio }) {
  const [draft, setDraft] = useState<TransactionDraft | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const {
    views,
    summary,
    transactions,
    isLoading,
    isFetchingQuotes,
    quotesUpdatedAt,
    refetchQuotes,
  } = usePortfolioPositions(portfolio.id);

  return (
    <div className='flex flex-col gap-4 sm:gap-5'>
      <PortfolioHeader
        portfolio={portfolio}
        actions={
          <>
            <RefreshIndicator
              updatedAt={quotesUpdatedAt}
              isFetching={isFetchingQuotes}
              onRefresh={() => void refetchQuotes()}
            />
            <PortfolioActions portfolio={portfolio} />
            <Button
              size='sm'
              aria-label='Nova transação'
              onClick={() => setDraft({})}
            >
              <Plus />
              <span className='hidden sm:inline'>Nova transação</span>
            </Button>
          </>
        }
      />

      {isLoading ? (
        <PortfolioSkeleton />
      ) : (
        <>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'>
            <StatCard label='Valor de mercado'>
              {formatMoney(summary.marketValue, portfolio.currency)}
            </StatCard>
            <StatCard label='Investido'>
              {formatMoney(summary.investedValue, portfolio.currency)}
            </StatCard>
            <StatCard label='P/L diário %'>
              <PLValue value={summary.dailyPLPercent} />
            </StatCard>
            <StatCard label='P/L diário'>
              <PLValue value={summary.dailyPL} currency={portfolio.currency} />
            </StatCard>
            <StatCard label='P/L líquido %'>
              <PLValue value={summary.netPLPercent} />
            </StatCard>
            <StatCard label='P/L líquido'>
              <PLValue value={summary.netPL} currency={portfolio.currency} />
            </StatCard>
          </div>

          <Tabs defaultValue='positions'>
            <div className='overflow-x-auto'>
              <TabsList>
                <TabsTrigger value='positions'>Posições</TabsTrigger>
                <TabsTrigger value='transactions'>Transações</TabsTrigger>
                <TabsTrigger value='incomes'>Proventos</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value='positions'>
              <PositionsTable
                portfolioId={portfolio.id}
                currency={portfolio.currency}
                views={views}
                onNewTransaction={(ticker, side) => setDraft({ ticker, side })}
              />
            </TabsContent>
            <TabsContent value='transactions'>
              <TransactionsTable
                currency={portfolio.currency}
                transactions={transactions}
                onEdit={setEditing}
              />
            </TabsContent>
            <TabsContent value='incomes'>
              <IncomesTab
                portfolio={portfolio}
                investedValue={summary.investedValue}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {draft && (
        <TransactionDialog
          portfolio={portfolio}
          initialTicker={draft.ticker}
          initialSide={draft.side}
          onClose={() => setDraft(null)}
        />
      )}

      {editing && (
        <TransactionDialog
          portfolio={portfolio}
          transaction={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
