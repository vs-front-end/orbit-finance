export { authService, type AuthService } from './auth';
export {
  assetsService,
  findAsset,
  type AssetsService,
  type AssetHit,
} from './assets';
export {
  portfoliosService,
  type PortfoliosService,
  type NewPortfolio,
  type NewTransaction,
  type UpdateTransaction,
  type NewIncome,
  type NewFixedIncome,
} from './portfolios';
export { cdiService, type CdiService } from './cdi';
export {
  targetsService,
  type TargetsService,
  type AllocationTargets,
} from './targets';
export { quotesService, type QuotesService } from './quotes';
export {
  historyService,
  type HistoryService,
  type HistoryPoint,
  type PortfolioHistory,
} from './history';
export {
  patrimonyService,
  type PatrimonyService,
  type NewPatrimonyItem,
  type UpdatePatrimonyItem,
} from './patrimony';
