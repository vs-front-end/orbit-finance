import { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  InputText,
  Separator,
  Text,
} from '@stellar-ui-kit/web';

import { grossValueAfterDays, irRateForDays } from '@/domain';
import { useCdiAnnual } from '@/hooks';
import { formatMoney, formatPercent, parseDecimal } from '@/utils';

import { MoneyInput } from '@/components';

export function CdbSimulator() {
  const { data: cdiDefault } = useCdiAnnual();
  const [amount, setAmount] = useState<number | null>(1000);
  const [cdiPercent, setCdiPercent] = useState('110');
  const [months, setMonths] = useState('24');
  const [cdiAnnualInput, setCdiAnnualInput] = useState('');

  const principal = amount ?? 0;
  const percent = parseDecimal(cdiPercent);
  const totalMonths = parseDecimal(months);
  const cdiAnnual =
    cdiAnnualInput.trim() !== ''
      ? parseDecimal(cdiAnnualInput) / 100
      : (cdiDefault ?? 0);

  const days = Math.round(totalMonths * 30.44);
  const hasInput = principal > 0 && percent > 0 && days > 0 && cdiAnnual > 0;

  const gross = hasInput
    ? grossValueAfterDays(principal, cdiAnnual, percent, days)
    : 0;
  const irRate = irRateForDays(days);
  const grossYield = gross - principal;
  const irAmount = grossYield * irRate;
  const net = gross - irAmount;
  const netYieldPercent =
    principal > 0 ? ((net - principal) / principal) * 100 : 0;
  const netAnnualPercent =
    days > 0 && principal > 0
      ? ((net / principal) ** (365 / days) - 1) * 100
      : 0;
  const lciEquivalent = percent * (1 - irRate);

  return (
    <div className='flex flex-col gap-5 sm:gap-6'>
      <header>
        <Text as='h2' className='text-2xl sm:text-3xl'>
          Simulador CDB / CDI
        </Text>
        <Text as='p' styleVariant='muted' className='text-xs sm:text-sm'>
          Projeção de renda fixa atrelada ao CDI com IR regressivo
        </Text>
      </header>

      <Card className='gap-4 py-4 sm:py-5'>
        <CardHeader className='px-4 sm:px-5'>
          <CardDescription>
            CDI constante de {formatPercent(cdiAnnual * 100, false)} a.a. IOF
            não entra no cálculo (resgates antes de 30 dias).
          </CardDescription>
        </CardHeader>
        <CardContent className='mt-0 flex flex-col gap-4 px-4 sm:px-5'>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <MoneyInput
              label='Valor aplicado (R$)'
              value={amount}
              onChange={setAmount}
            />
            <InputText
              label='% do CDI'
              value={cdiPercent}
              onChange={setCdiPercent}
            />
            <InputText
              label='Prazo (meses)'
              value={months}
              onChange={setMonths}
            />
            <InputText
              label='CDI a.a. (%)'
              placeholder={formatPercent(
                (cdiDefault ?? 0) * 100,
                false,
              ).replace('%', '')}
              value={cdiAnnualInput}
              onChange={setCdiAnnualInput}
              helperText='Vazio = CDI atual'
            />
          </div>

          {hasInput && (
            <>
              <Separator />

              <div className='grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4'>
                <ResultItem label='Valor bruto'>
                  {formatMoney(gross, 'BRL')}
                </ResultItem>
                <ResultItem label='Rendimento bruto'>
                  <span className='text-success-text'>
                    {formatMoney(grossYield, 'BRL')}
                  </span>
                </ResultItem>
                <ResultItem
                  label={`IR (${formatPercent(irRate * 100, false)})`}
                >
                  <span className='text-error-text'>
                    -{formatMoney(irAmount, 'BRL')}
                  </span>
                </ResultItem>
                <ResultItem label='Valor líquido'>
                  <span className='text-success-text'>
                    {formatMoney(net, 'BRL')}
                  </span>
                </ResultItem>
              </div>

              <Separator />

              <div className='flex flex-col gap-1.5 text-xs text-muted'>
                <span>
                  Rentabilidade líquida:{' '}
                  <span className='font-medium text-foreground'>
                    {formatPercent(netYieldPercent, false)}
                  </span>{' '}
                  no período ·{' '}
                  <span className='font-medium text-foreground'>
                    {formatPercent(netAnnualPercent, false)} a.a.
                  </span>
                </span>
                <span>
                  Equivalência: este CDB rende o mesmo que uma{' '}
                  <span className='font-medium text-foreground'>
                    LCI/LCA de {formatPercent(lciEquivalent, false)} do CDI
                  </span>{' '}
                  (isenta de IR) no mesmo prazo.
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-[11px] uppercase tracking-wide text-muted'>
        {label}
      </span>
      <span className='text-sm font-semibold tabular-nums sm:text-base'>
        {children}
      </span>
    </div>
  );
}
