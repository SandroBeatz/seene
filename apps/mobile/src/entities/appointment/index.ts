/** Appointment entity — public barrel. */
export {
  appointmentKeys,
  invalidateAppointmentCaches,
  useAppointmentsRangeQuery,
  useVisitHistoryQuery,
  useActionableAppointmentsQuery,
  useAppointmentQuery,
  useClientAppointmentCountQuery,
  useClientVisitCountQuery,
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
export {
  getAppointmentPhase,
  isShownInSchedule,
  scheduleCardLook,
  visitProgress,
  minutesUntilStart,
  appointmentColor,
  PHASE_TONE,
  PREVIEW_ACTIONS,
  DESTRUCTIVE_ACTIONS,
} from './lib/presentation';
export type {
  AppointmentPhase,
  StatusTone,
  ScheduleCardLook,
  AppointmentAction,
  PreviewActions,
  VisitProgress,
} from './lib/presentation';
export type {
  Appointment,
  AppointmentStatus,
  EffectiveAppointmentStatus,
  AppointmentSource,
  AppointmentCancelledBy,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  VisitHistoryRow,
} from './model/types';
