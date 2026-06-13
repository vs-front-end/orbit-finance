import type { z } from 'zod';

export function readStored<T>(key: string, schema: z.ZodType<T>): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  const parsed = schema.safeParse(safeJsonParse(raw));
  if (!parsed.success) {
    localStorage.removeItem(key);
    return null;
  }

  return parsed.data;
}

export function writeStored(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
