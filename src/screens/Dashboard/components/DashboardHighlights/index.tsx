import { useState, type ReactNode } from 'react';

import { cn } from '@stellar-ui-kit/shared';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@stellar-ui-kit/web';

import { PLValue } from '@/components';
import type { DividendPayer } from '@/domain';
import type { DashboardMover } from '@/hooks';
import { formatMoney } from '@/utils';

type HighlightsView = 'gainers' | 'losers' | 'payers';

type DashboardHighlightsProps = {
  gainers: DashboardMover[];
  losers: DashboardMover[];
  payers: DividendPayer[];
};

const selectorClass =
  'h-8 w-auto gap-1 border-0 bg-background px-3 text-xs text-foreground shadow-none hover:bg-background';

const EMPTY_LABEL: Record<HighlightsView, string> = {
  gainers: 'Sem altas no dia',
  losers: 'Sem baixas no dia',
  payers: 'Nenhum provento recebido ainda',
};

function isHighlightsView(value: string): value is HighlightsView {
  return value === 'gainers' || value === 'losers' || value === 'payers';
}

function RankingRow({
  rank,
  ticker,
  value,
}: {
  rank: number;
  ticker: string;
  value: ReactNode;
}) {
  return (
    <li className='flex min-w-0 items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0'>
      <div className='flex min-w-0 items-center gap-2.5'>
        <span className='w-4 shrink-0 text-xs tabular-nums text-muted'>
          {rank}
        </span>
        <span className='truncate text-sm font-medium'>{ticker}</span>
      </div>
      <div className='shrink-0 text-sm'>{value}</div>
    </li>
  );
}

export function DashboardHighlights({
  gainers,
  losers,
  payers,
}: DashboardHighlightsProps) {
  const [view, setView] = useState<HighlightsView>('gainers');

  const lists: Record<
    HighlightsView,
    Array<{ ticker: string; value: ReactNode }>
  > = {
    gainers: gainers.map((mover) => ({
      ticker: mover.ticker,
      value: <PLValue value={mover.dailyPLPercent} />,
    })),
    losers: losers.map((mover) => ({
      ticker: mover.ticker,
      value: <PLValue value={mover.dailyPLPercent} />,
    })),
    payers: payers.map((payer) => ({
      ticker: payer.ticker,
      value: (
        <span className='tabular-nums font-medium text-success-text'>
          {formatMoney(payer.received, 'BRL')}
        </span>
      ),
    })),
  };

  const rows = lists[view];

  return (
    <Card className='min-w-0 gap-3 py-3 sm:py-4'>
      <CardHeader className='px-4 sm:px-5'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <CardTitle className='text-sm'>Destaques</CardTitle>
          <Select
            value={view}
            onValueChange={(next) => {
              if (isHighlightsView(next)) setView(next);
            }}
          >
            <SelectTrigger className={cn(selectorClass, 'w-full sm:w-auto')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='gainers'>Maiores altas</SelectItem>
              <SelectItem value='losers'>Maiores baixas</SelectItem>
              <SelectItem value='payers'>Maiores pagadoras</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className='mt-0 min-w-0 px-4 sm:px-5'>
        {rows.length === 0 ? (
          <div className='flex flex-col items-center gap-1.5 py-8 text-center'>
            <Text as='p' className='text-sm font-medium'>
              {EMPTY_LABEL[view]}
            </Text>
          </div>
        ) : (
          <ul className='min-w-0'>
            {rows.map((row, index) => (
              <RankingRow
                key={row.ticker}
                rank={index + 1}
                ticker={row.ticker}
                value={row.value}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
