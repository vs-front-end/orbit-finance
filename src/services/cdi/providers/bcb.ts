import { z } from 'zod';

import type { CdiRatePoint } from '@/domain';
import { env } from '@/config';

const latestPointSchema = z
  .array(z.object({ data: z.string(), valor: z.string() }))
  .min(1);
const seriesSchema = z.array(z.object({ data: z.string(), valor: z.string() }));

type BcbPoint = { date: string; daily: number };

function fromBcbDate(bcbDate: string): string {
  const [day, month, year] = bcbDate.split('/');
  return `${year}-${month}-${day}`;
}

function toBcbDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDaily(valor: string): number {
  const daily = Number(valor) / 100;
  if (!Number.isFinite(daily) || daily <= 0)
    throw new Error('bcb: taxa inválida');
  return daily;
}

function parseBcbSeries(
  rows: z.infer<typeof seriesSchema>,
): CdiRatePoint[] {
  return rows.map((row) => ({
    date: fromBcbDate(row.data),
    daily: parseDaily(row.valor),
  }));
}

async function fetchBcbLatest(): Promise<BcbPoint> {
  const response = await fetch(
    `${env.VITE_BCB_SGS_URL}/bcdata.sgs.12/dados/ultimos/1?formato=json`,
  );
  if (!response.ok) throw new Error(`bcb: HTTP ${response.status}`);

  const data = latestPointSchema.parse(await response.json());
  const latest = data[data.length - 1];
  if (!latest) throw new Error('bcb: taxa inválida');

  return {
    date: fromBcbDate(latest.data),
    daily: parseDaily(latest.valor),
  };
}

export async function getBcbCdiAnnual(): Promise<number> {
  const { daily } = await fetchBcbLatest();
  return (1 + daily) ** 252 - 1;
}

export async function getBcbCdiSeries(since: string): Promise<CdiRatePoint[]> {
  const start = since.trim();
  const today = todayIso();
  if (start === '' || start > today) return [];

  const latest = await fetchBcbLatest();
  const end = today < latest.date ? today : latest.date;
  if (start > end) return [];

  const params = new URLSearchParams({
    formato: 'json',
    dataInicial: toBcbDate(start),
    dataFinal: toBcbDate(end),
  });
  const response = await fetch(
    `${env.VITE_BCB_SGS_URL}/bcdata.sgs.12/dados?${params}`,
  );
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`bcb: HTTP ${response.status}`);

  return parseBcbSeries(seriesSchema.parse(await response.json()));
}
