/** Sale entity — public barrel. */
export {
  saleKeys,
  useSaleByAppointmentQuery,
  useSaleAmountsRangeQuery,
  useCompleteAppointmentMutation,
  useUpdateFinishedVisitMutation,
} from './model/queries';
export type {
  CompleteAppointmentDto,
  UpdateFinishedVisitDto,
  SaleAmount,
  Sale,
  SaleItem,
  SaleRow,
  PaymentTypeRef,
} from './model/types';
