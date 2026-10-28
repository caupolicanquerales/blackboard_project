import type { Appointment } from '../../../../shared/models/appointment';

export type AppointmentCardProps = {
  appointment: Appointment;
  onSendWhatsApp: (appointment: Appointment) => void;
  onRequireCall: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onPress?: (appointment: Appointment) => void;
};
