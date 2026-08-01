import { z } from 'zod';

import { storedDividendSchema, type StoredDividend } from '@/domain';

import { supabase } from '../supabase';

export type DividendEdit = {
  paymentDate: string;
  label: string;
  received: number;
  tax: number;
};

export type LedgerService = {
  list: () => Promise<StoredDividend[]>;
  freeze: (entries: StoredDividend[]) => Promise<void>;
  edit: (id: string, input: DividendEdit) => Promise<StoredDividend>;
};

export const ledgerService: LedgerService = {
  async list() {
    const { data, error } = await supabase.from('dividends').select('*');
    if (error) throw new Error(error.message);

    return z.array(storedDividendSchema).parse(data);
  },

  async freeze(entries) {
    if (entries.length === 0) return;

    const { error } = await supabase
      .from('dividends')
      .upsert(entries, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  },

  async edit(id, input) {
    const { data, error } = await supabase
      .from('dividends')
      .update({ ...input, estimatedPayment: false, editedManually: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    return storedDividendSchema.parse(data);
  },
};
