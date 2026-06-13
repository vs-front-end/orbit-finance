import { useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InputText,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@stellar-ui-kit/web';

import { LineChart } from '@/components/Charts';
import { formatMoney, parseDecimal } from '@/utils';

import { MoneyInput, StatCard } from '@/components';

import { MonthlyTable, type CompoundRow } from './MonthlyTable';

const MAX_MONTHS = 1200;

function formatCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function CompoundInterest() {
  const [initialAmount, setInitialAmount] = useState<number | null>(45000);
  const [monthlyAmount, setMonthlyAmount] = useState<number | null>(10000);
  const [rate, setRate] = useState('12');
  const [ratePeriod, setRatePeriod] = useState('yearly');
  const [period, setPeriod] = useState('8');
  const [periodUnit, setPeriodUnit] = useState('years');

  const months = Math.min(
    MAX_MONTHS,
    Math.round(parseDecimal(period) * (periodUnit === 'years' ? 12 : 1)),
  );
  const ratePercent = parseDecimal(rate) / 100;
  const monthlyRate =
    ratePeriod === 'yearly' ? (1 + ratePercent) ** (1 / 12) - 1 : ratePercent;

  // Convenção Investidor Sardinha: a linha do mês fecha com os juros do mês;
  // o aporte entra depois do fechamento (rende a partir do mês seguinte).
  const rows: CompoundRow[] = [];
  let balance = initialAmount ?? 0;
  let invested = initialAmount ?? 0;
  let totalInterest = 0;
  for (let month = 0; month < months; month++) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance += interest;
    rows.push({ month, interest, invested, totalInterest, balance });
    balance += monthlyAmount ?? 0;
    invested += monthlyAmount ?? 0;
  }

  const hasResult = rows.length > 0 && balance > 0;

  return (
    <div className='flex flex-col gap-5 sm:gap-6'>
      <header>
        <Text as='h2' className='text-2xl sm:text-3xl'>
          Juros compostos
        </Text>
        <Text as='p' styleVariant='muted' className='text-xs sm:text-sm'>
          Simule aportes mensais rendendo ao longo do tempo
        </Text>
      </header>

      <Card className='gap-4 py-4 sm:py-5'>
        <CardContent className='mt-0 grid grid-cols-2 gap-3 px-4 sm:px-5 lg:grid-cols-4'>
          <MoneyInput
            label='Valor inicial (R$)'
            value={initialAmount}
            onChange={setInitialAmount}
          />
          <MoneyInput
            label='Valor mensal (R$)'
            value={monthlyAmount}
            onChange={setMonthlyAmount}
          />

          <div className='col-span-2 space-y-2 lg:col-span-1'>
            <Label>Taxa de juros (%)</Label>
            <div className='flex gap-2'>
              <InputText
                className='min-w-0 flex-1'
                value={rate}
                onChange={setRate}
                placeholder='12'
              />
              <Select value={ratePeriod} onValueChange={setRatePeriod}>
                <SelectTrigger className='shrink-0'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='yearly'>anual</SelectItem>
                  <SelectItem value='monthly'>mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='col-span-2 space-y-2 lg:col-span-1'>
            <Label>Período</Label>
            <div className='flex gap-2'>
              <InputText
                className='min-w-0 flex-1'
                value={period}
                onChange={setPeriod}
                placeholder='8'
              />
              <Select value={periodUnit} onValueChange={setPeriodUnit}>
                <SelectTrigger className='shrink-0'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='years'>ano(s)</SelectItem>
                  <SelectItem value='months'>mês(es)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasResult && (
        <>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4'>
            <StatCard label='Valor total final'>
              <span className='text-primary-text'>
                {formatMoney(balance, 'BRL')}
              </span>
            </StatCard>
            <StatCard label='Valor total investido'>
              {formatMoney(invested, 'BRL')}
            </StatCard>
            <StatCard label='Total em juros'>
              <span className='text-success-text'>
                {formatMoney(totalInterest, 'BRL')}
              </span>
            </StatCard>
          </div>

          <Card className='gap-4 py-4 sm:py-5'>
            <CardHeader className='px-4 sm:px-5'>
              <CardTitle className='text-sm'>Evolução</CardTitle>
            </CardHeader>
            <CardContent className='mt-0 px-4 sm:px-5'>
              <LineChart
                series={[
                  {
                    id: 'balance',
                    label: 'Total acumulado',
                    points: rows.map((row) => ({
                      t: row.month,
                      value: row.balance,
                    })),
                  },
                  {
                    id: 'invested',
                    label: 'Valor investido',
                    points: rows.map((row) => ({
                      t: row.month,
                      value: row.invested,
                    })),
                  },
                ]}
                formatValue={formatCompact}
                formatTooltipValue={(value) => formatMoney(value, 'BRL')}
                formatDate={(t) => `${Math.round(t)}º mês`}
              />
            </CardContent>
          </Card>

          <MonthlyTable rows={rows} />
        </>
      )}
    </div>
  );
}
