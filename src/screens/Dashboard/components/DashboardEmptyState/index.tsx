import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@stellar-ui-kit/web';

export function DashboardEmptyState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Nenhuma carteira de investimento</EmptyTitle>
        <EmptyDescription>
          Crie uma carteira no menu lateral para começar a acompanhar suas
          posições.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
