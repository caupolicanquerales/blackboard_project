import type { PatientType, SeverityLevel } from './common';

export type AppointmentStatus =
  | 'PENDING_TRIAGE'
  | 'SCHEDULED'
  | 'WHATSAPP_SENT'
  | 'CALL_REQUIRED'
  | 'CONFIRMED'
  | 'IN_CONSULTATION'
  | 'COMPLETED';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientType: PatientType;
  doctorId: string;
  appointmentType: 'CONSULTATION' | 'SURGICAL_PROCEDURE';
  status: AppointmentStatus;
  priorityScore: number;
  severityLevel: SeverityLevel;
  scheduledTime: string;
  durationMinutes: number;
}

export interface DoctorSchedule {
  doctorId: string;
  doctorName: string;
  availableSlots: string[];
  blockedSlots: string[];
}
