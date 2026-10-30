/** Appointment actions — public barrel. */
export {
  useAppointmentActions,
  type AppointmentActionContext,
  type AppointmentActionKey,
} from './model/useAppointmentActions';
export { NoteEditor } from './ui/NoteEditor';
export { appendChip, NOTE_MAX_LENGTH } from './model/note';
export { ServicesEditor, type ServicesEditorProps } from './ui/ServicesEditor';
export { RescheduleEditor, type RescheduleEditorProps } from './ui/RescheduleEditor';
