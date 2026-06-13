import { z } from 'zod';

import { readStored, writeStored } from '../storage';

export type AllocationTargets = Record<string, number>;

export type TargetsService = {
  getTargets: () => Promise<AllocationTargets>;
  setTargets: (targets: AllocationTargets) => Promise<void>;
};

const TARGETS_KEY = 'orbit.allocation-targets';

const targetsSchema = z.record(z.string(), z.number().min(0).max(100));

export const targetsService: TargetsService = {
  async getTargets() {
    return readStored(TARGETS_KEY, targetsSchema) ?? {};
  },

  async setTargets(targets) {
    writeStored(TARGETS_KEY, targets);
  },
};
