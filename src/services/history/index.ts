import { z } from 'zod';

import type { Currency } from '@/domain';

import { portfoliosService } from '../portfolios';
import { supabase } from '../supabase';

export type HistoryPoint = { t: number; value: number };

export type PortfolioHistory = {
  portfolioId: string;
  name: string;
  currency: Currency;
  points: HistoryPoint[];
};

export type SnapshotEntry = {
  portfolioId: string;
  value: number;
  currency: Currency;
};

export type HistoryService = {
  getHistory: (days: number) => Promise<PortfolioHistory[]>;
  recordSnapshot: (entries: SnapshotEntry[]) => Promise<void>;
};

const DAY_MS = 86_400_000;

const snapshotSchema = z.object({
  portfolioId: z.string(),
  date: z.string(),
  value: z.number(),
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const historyService: HistoryService = {
  async getHistory(days) {
    const portfolios = await portfoliosService.list();
    const investments = portfolios.filter(
      (portfolio) => portfolio.kind === 'investment',
    );

    const since = new Date(Date.now() - days * DAY_MS)
      .toISOString()
      .slice(0, 10);
    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('"portfolioId", date, value')
      .gte('date', since)
      .order('date');
    if (error) throw new Error(error.message);

    const snapshots = z.array(snapshotSchema).parse(data);

    return investments
      .map((portfolio) => ({
        portfolioId: portfolio.id,
        name: portfolio.name,
        currency: portfolio.currency,
        points: snapshots
          .filter((snapshot) => snapshot.portfolioId === portfolio.id)
          .map((snapshot) => ({
            t: Date.parse(`${snapshot.date}T00:00:00.000Z`),
            value: snapshot.value,
          })),
      }))
      .filter((history) => history.points.length > 0);
  },

  async recordSnapshot(entries) {
    const date = today();
    const rows = entries.map((entry) => ({
      id: `${entry.portfolioId}-${date}`,
      portfolioId: entry.portfolioId,
      date,
      value: entry.value,
      currency: entry.currency,
    }));

    const { error } = await supabase
      .from('portfolio_snapshots')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  },
};
