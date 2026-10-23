/** Appointment entity — public barrel. */
export {
  appointmentKeys,
  useAppointmentsRangeQuery,
  useActionableAppointmentsQuery,
  useAppointmentQuery,
  useClientAppointmentCountQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
} from './model/queries';
export {
  appointmentEndMs,
  getEffectiveAppointmentStatus,
  isActionable,
  lastVisitDate,
  sumServiceDuration,
  sumServicePrice,
  appointmentTotalPrice,
} from './lib/derive';
export type {
  Appointment,
  AppointmentStatus,
  EffectiveAppointmentStatus,
  AppointmentSource,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './model/types';
