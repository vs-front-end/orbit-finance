import { createFileRoute } from '@tanstack/react-router';

import { PortfolioScreen } from '@/screens/Portfolio';

export const Route = createFileRoute('/_app/carteiras/$portfolioId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { portfolioId } = Route.useParams();
  return <PortfolioScreen portfolioId={portfolioId} />;
}
