import { getBcbCdiAnnual } from './providers/bcb';

export type CdiService = {
  getCdiAnnual: () => Promise<number>;
};

export const cdiService: CdiService = {
  async getCdiAnnual() {
    return getBcbCdiAnnual();
  },
};
