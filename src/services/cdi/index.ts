import type { CdiRatePoint } from '@/domain';

import { getBcbCdiSeries } from './providers/bcb';

export type CdiService = {
  getCdiSeries: (since: string) => Promise<CdiRatePoint[]>;
};

export const cdiService: CdiService = {
  async getCdiSeries(since) {
    return getBcbCdiSeries(since);
  },
};
