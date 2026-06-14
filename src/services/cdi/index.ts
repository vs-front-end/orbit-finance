import type { CdiRatePoint } from '@/domain';

import { getBcbCdiAnnual, getBcbCdiSeries } from './providers/bcb';

export type CdiService = {
  getCdiAnnual: () => Promise<number>;
  getCdiSeries: (since: string) => Promise<CdiRatePoint[]>;
};

export const cdiService: CdiService = {
  async getCdiAnnual() {
    return getBcbCdiAnnual();
  },
  async getCdiSeries(since) {
    return getBcbCdiSeries(since);
  },
};
