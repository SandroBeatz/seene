/** Analytics entity — public barrel. */
export {
  analyticsKeys,
  useMoneyClientsQuery,
  useMoneyOverviewQuery,
  useSaleOperationsQuery,
} from './model/queries';
export {
  canStepForward,
  currentPeriod,
  customPeriod,
  periodDays,
  periodRange,
  shiftPeriod,
  stepPeriod,
  type Period,
  type PeriodRange,
  type PeriodUnit,
} from './lib/period';
export type {
  MoneyOverview,
  PeriodClient,
  PeriodMetrics,
  SaleOperation,
  TopClient,
} from './model/types';
