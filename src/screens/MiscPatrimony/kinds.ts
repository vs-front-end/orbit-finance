import type { PatrimonyKind } from '@/domain';

export type KindMeta = {
  label: string;
  valueLabel: string;
  defaultRate?: string;
};

export const KIND_META: Record<PatrimonyKind, KindMeta> = {
  cash: { label: 'Caixa', valueLabel: 'Valor (BRL)' },
  reserve: { label: 'Reserva', valueLabel: 'Valor aplicado (BRL)' },
  property: { label: 'Imóvel', valueLabel: 'Valor (BRL)', defaultRate: '5' },
  vehicle: {
    label: 'Veículo',
    valueLabel: 'Valor de compra (BRL)',
    defaultRate: '10',
  },
};

export const KIND_ORDER: PatrimonyKind[] = [
  'cash',
  'reserve',
  'property',
  'vehicle',
];
