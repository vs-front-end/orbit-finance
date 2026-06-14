import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InputText,
  Skeleton,
  Text,
} from '@stellar-ui-kit/web';

import { Check } from 'lucide-react';

import { buildRebalancePlan } from '@/domain';
import { DonutChart } from '@/components/Charts';
import { useDashboardData, useSetTargets, useTargets } from '@/hooks';
import {
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  parseDecimal,
} from '@/utils';

import { MoneyInput } from '@/components';

export function Rebalance() {
  const { perPortfolio, usdBrlRate, isLoading } = useDashboardData();
  const { data: targets, isLoading: targetsLoading } = useTargets();
  const setTargets = useSetTargets();

  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [extraContribution, setExtraContribution] = useState<number | null>(
    null,
  );

  if (isLoading || targetsLoading) {
    return (
      <div className='flex flex-col gap-6'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-96 w-full' />
      </div>
    );
  }

  const rows = perPortfolio.map(({ portfolio, summary }) => ({
    portfolio,
    valueBRL:
      portfolio.currency === 'USD'
        ? summary.marketValue * usdBrlRate
        : summary.marketValue,
  }));

  const savedDraft = Object.fromEntries(
    rows.map(({ portfolio }) => {
      const saved = targets?.[portfolio.id];
      return [portfolio.id, saved !== undefined ? String(saved) : ''];
    }),
  );
  const effectiveDraft = draft ?? savedDraft;

  const {
    currentTotal,
    plannedTotal,
    targetSum,
    rows: computed,
  } = buildRebalancePlan(
    rows.map(({ portfolio, valueBRL }) => ({
      portfolio,
      valueBRL,
      targetPercent: parseDecimal(effectiveDraft[portfolio.id] ?? ''),
    })),
    extraContribution ?? 0,
  );

  const hasTargets = targetSum > 0;

  const handleSave = () => {
    const next = Object.fromEntries(
      Object.entries(effectiveDraft)
        .map(([id, value]) => [id, parseDecimal(value)] as const)
        .filter(([, value]) => value > 0),
    );
    setTargets.mutate(next);
  };

  return (
    <div className='flex flex-col gap-5 sm:gap-6'>
      <header className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <Text as='h2' className='text-2xl sm:text-3xl'>
            Rebalanceamento
          </Text>
          <Text as='p' styleVariant='muted' className='text-xs sm:text-sm'>
            Defina a alocação alvo e veja quanto mover em cada carteira (valores
            em BRL)
          </Text>
        </div>
        <Button
          size='sm'
          onClick={handleSave}
          disabled={setTargets.isPending || draft === null}
        >
          <Check />
          Salvar alvos
        </Button>
      </header>

      <Card className='gap-4 py-4 sm:py-5'>
        <CardHeader className='px-4 sm:px-5'>
          <CardTitle className='flex flex-wrap items-center justify-between gap-2 text-sm'>
            <span className='flex items-center gap-2'>
              Alvos por carteira
              {hasTargets && Math.round(targetSum) !== 100 && (
                <Badge variant='warning'>
                  somam {formatPercent(targetSum, false)}
                </Badge>
              )}
              {hasTargets && Math.round(targetSum) === 100 && (
                <Badge variant='success'>100%</Badge>
              )}
            </span>
            <span className='text-xs font-normal text-muted'>
              Patrimônio: {formatMoney(currentTotal, 'BRL')}
              {extraContribution
                ? ` · com aporte: ${formatMoney(plannedTotal, 'BRL')}`
                : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className='mt-0 flex flex-col gap-4 px-4 sm:px-5'>
          <div className='max-w-xs'>
            <MoneyInput
              label='Aporte adicional (R$)'
              value={extraContribution}
              onChange={setExtraContribution}
              helperText='Opcional. Distribui o aporte no cálculo.'
            />
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full text-xs sm:text-sm'>
              <thead>
                <tr className='border-b border-border text-left text-[11px] uppercase tracking-wide text-muted'>
                  <th className='py-2 pr-3 font-medium'>Carteira</th>
                  <th className='py-2 pr-3 text-right font-medium'>Hoje</th>
                  <th className='py-2 pr-3 text-right font-medium'>Atual %</th>
                  <th className='py-2 pr-3 text-right font-medium'>Alvo %</th>
                  <th className='py-2 pr-3 text-right font-medium'>
                    Valor alvo
                  </th>
                  <th className='py-2 text-right font-medium'>Ajuste</th>
                </tr>
              </thead>
              <tbody>
                {computed.map(
                  ({
                    portfolio,
                    valueBRL,
                    currentPercent,
                    targetPercent,
                    targetValue,
                    diff,
                  }) => (
                    <tr
                      key={portfolio.id}
                      className='border-b border-border last:border-0'
                    >
                      <td className='py-2.5 pr-3 font-medium'>
                        {portfolio.name}
                      </td>
                      <td className='whitespace-nowrap py-2.5 pr-3 text-right tabular-nums'>
                        {formatMoney(valueBRL, 'BRL')}
                      </td>
                      <td className='py-2.5 pr-3 text-right tabular-nums text-muted'>
                        {formatPercent(currentPercent, false)}
                      </td>
                      <td className='py-2.5 pr-3 text-right'>
                        <InputText
                          value={effectiveDraft[portfolio.id] ?? ''}
                          onChange={(value) =>
                            setDraft({
                              ...effectiveDraft,
                              [portfolio.id]: value,
                            })
                          }
                          placeholder='0'
                          containerClassName='ml-auto w-16'
                          className='h-7 px-2 text-right text-xs'
                        />
                      </td>
                      <td className='whitespace-nowrap py-2.5 pr-3 text-right tabular-nums text-muted'>
                        {targetPercent > 0
                          ? formatMoney(targetValue, 'BRL')
                          : '-'}
                      </td>
                      <td className='whitespace-nowrap py-2.5 text-right tabular-nums'>
                        {targetPercent > 0 ? (
                          <span
                            className={`font-medium ${
                              diff >= 0
                                ? 'text-success-text'
                                : 'text-error-text'
                            }`}
                          >
                            {diff >= 0 ? 'aportar' : 'reduzir'}{' '}
                            {formatMoney(Math.abs(diff), 'BRL')}
                          </span>
                        ) : (
                          <span className='text-muted'>-</span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {hasTargets && (
        <Card className='gap-4 py-4 sm:py-5'>
          <CardContent className='mt-0 grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 sm:px-5'>
            <DonutChart
              title='Atual'
              centerLabel={formatMoneyCompact(currentTotal, 'BRL')}
              slices={computed.map(({ portfolio, valueBRL }) => ({
                label: portfolio.name,
                value: valueBRL,
              }))}
            />
            <DonutChart
              title='Rebalanceado'
              centerLabel={formatMoneyCompact(plannedTotal, 'BRL')}
              slices={computed
                .filter(({ targetPercent }) => targetPercent > 0)
                .map(({ portfolio, targetPercent }) => ({
                  label: portfolio.name,
                  value: targetPercent,
                }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
