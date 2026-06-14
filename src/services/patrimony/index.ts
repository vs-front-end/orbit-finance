import { z } from 'zod';

import {
  patrimonyItemSchema,
  type PatrimonyItem,
  type PatrimonyKind,
} from '@/domain';

import { supabase } from '../supabase';

export type NewPatrimonyItem = {
  name: string;
  kind: PatrimonyKind;
  value: number;
  referenceDate: string | null;
  cdiPercent: number | null;
  annualRate: number | null;
};

export type UpdatePatrimonyItem = NewPatrimonyItem;

export type PatrimonyService = {
  list: () => Promise<PatrimonyItem[]>;
  add: (input: NewPatrimonyItem) => Promise<PatrimonyItem>;
  update: (id: string, input: UpdatePatrimonyItem) => Promise<PatrimonyItem>;
  remove: (id: string) => Promise<void>;
};

function unwrap<T>(result: {
  data: T | null;
  error: { message: string } | null;
}): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export const patrimonyService: PatrimonyService = {
  async list() {
    const rows = unwrap(
      await supabase.from('patrimony_items').select('*').order('createdAt'),
    );
    return z.array(patrimonyItemSchema).parse(rows);
  },

  async add(input) {
    const item = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    const row = unwrap(
      await supabase.from('patrimony_items').insert(item).select().single(),
    );
    return patrimonyItemSchema.parse(row);
  },

  async update(id, input) {
    const row = unwrap(
      await supabase
        .from('patrimony_items')
        .update(input)
        .eq('id', id)
        .select()
        .single(),
    );
    return patrimonyItemSchema.parse(row);
  },

  async remove(id) {
    unwrap(
      await supabase.from('patrimony_items').delete().eq('id', id).select(),
    );
  },
};
