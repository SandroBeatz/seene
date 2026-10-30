/** Sale entity — public barrel. */
export {
  saleKeys,
  useSaleByAppointmentQuery,
  useSaleAmountsRangeQuery,
  useCompleteAppointmentMutation,
} from './model/queries';
export type {
  CompleteAppointmentDto,
  SaleAmount,
  Sale,
  SaleItem,
  SaleRow,
  PaymentTypeRef,
} from './model/types';
