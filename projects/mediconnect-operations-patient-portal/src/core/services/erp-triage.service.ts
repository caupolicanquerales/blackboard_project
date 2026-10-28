import type { Appointment, DoctorSchedule } from '../../shared/models/appointment';
import type { SeverityLevel } from '../../shared/models/common';

const BASE_SCORE: Record<SeverityLevel, number> = {
  URGENT: 9,
  HIGH: 7,
  MEDIUM: 4,
  ROUTINE: 1,
};

const DIAGNOSIS_WEIGHTS: ReadonlyArray<[RegExp, number]> = [
  [/cardiac|infarct|stroke|hemorrhage|sepsis|trauma/i, 1],
  [/cancer|tumor|oncolog|fracture|appendic/i, 0.5],
  [/follow-?up|checkup|routine|vaccin/i, -0.5],
];

const SEED: Appointment[] = [
  ['A-001', 'P-101', 'Ana Torres', 'SOCIAL_SECURITY', 'D-01', 'CONSULTATION', 'URGENT', 30],
  ['A-002', 'P-102', 'Bruno Díaz', 'PRIVATE', 'D-02', 'SURGICAL_PROCEDURE', 'HIGH', 120],
  ['A-003', 'P-103', 'Carla Gómez', 'SOCIAL_SECURITY', 'D-01', 'CONSULTATION', 'MEDIUM', 30],
  ['A-004', 'P-104', 'Diego Ruiz', 'PRIVATE', 'D-03', 'CONSULTATION', 'ROUTINE', 20],
  ['A-005', 'P-105', 'Elena Sosa', 'SOCIAL_SECURITY', 'D-02', 'SURGICAL_PROCEDURE', 'URGENT', 180],
  ['A-006', 'P-106', 'Fabián Ortiz', 'PRIVATE', 'D-03', 'SURGICAL_PROCEDURE', 'MEDIUM', 90],
  ['A-007', 'P-107', 'Gabriela Luna', 'SOCIAL_SECURITY', 'D-01', 'CONSULTATION', 'HIGH', 30],
  ['A-008', 'P-108', 'Héctor Vega', 'PRIVATE', 'D-02', 'CONSULTATION', 'ROUTINE', 20],
  ['A-009', 'P-109', 'Irene Paz', 'SOCIAL_SECURITY', 'D-03', 'SURGICAL_PROCEDURE', 'HIGH', 150],
  ['A-010', 'P-110', 'Julián Mora', 'PRIVATE', 'D-01', 'CONSULTATION', 'URGENT', 45],
].map(([id, patientId, patientName, patientType, doctorId, appointmentType, severityLevel, durationMinutes]) => ({
  id: id as string,
  patientId: patientId as string,
  patientName: patientName as string,
  patientType: patientType as Appointment['patientType'],
  doctorId: doctorId as string,
  appointmentType: appointmentType as Appointment['appointmentType'],
  status: 'PENDING_TRIAGE' as const,
  priorityScore: BASE_SCORE[severityLevel as SeverityLevel],
  severityLevel: severityLevel as SeverityLevel,
  scheduledTime: '',
  durationMinutes: durationMinutes as number,
}));

const SCHEDULES: DoctorSchedule[] = [
  {
    doctorId: 'D-01',
    doctorName: 'Dra. Laura Méndez',
    availableSlots: ['2026-11-02T09:00:00Z', '2026-11-02T10:00:00Z', '2026-11-03T09:00:00Z'],
    blockedSlots: ['2026-11-02T09:00:00Z'],
  },
  {
    doctorId: 'D-02',
    doctorName: 'Dr. Martín Castro',
    availableSlots: ['2026-11-02T08:00:00Z', '2026-11-02T14:00:00Z'],
    blockedSlots: [],
  },
  {
    doctorId: 'D-03',
    doctorName: 'Dra. Sofía Rey',
    availableSlots: ['2026-11-03T11:00:00Z', '2026-11-04T11:00:00Z'],
    blockedSlots: [],
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function calculatePriorityScore(severity: SeverityLevel, diagnosis: string = ''): number {
  const weight = DIAGNOSIS_WEIGHTS.reduce(
    (sum, [pattern, w]) => (pattern.test(diagnosis) ? sum + w : sum),
    0,
  );
  return Math.min(10, Math.max(0, BASE_SCORE[severity] + weight));
}

function rankQueue(list: Appointment[]): Appointment[] {
  return [...list].sort((a, b) => b.priorityScore - a.priorityScore);
}

async function fetchRecommendationQueue(): Promise<Appointment[]> {
  return clone(SEED);
}

async function fetchDoctorSchedules(): Promise<DoctorSchedule[]> {
  return clone(SCHEDULES);
}

function earliestFreeSlot(schedule: DoctorSchedule): string | undefined {
  const blocked = new Set(schedule.blockedSlots);
  return schedule.availableSlots
    .filter((slot) => !blocked.has(slot))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
}

/**
 * Picks the earliest free slot across all doctors. Urgent/high cases may take
 * any doctor's slot; lower priorities prefer their assigned doctor.
 * Does not mutate inputs. Returns the appointment unchanged when nothing is free.
 */
function assignSlot(appointment: Appointment, schedules: DoctorSchedule[]): Appointment {
  const candidates = schedules
    .map((s) => ({ schedule: s, slot: earliestFreeSlot(s) }))
    .filter((c): c is { schedule: DoctorSchedule; slot: string } => c.slot !== undefined);

  const flexible = appointment.priorityScore >= 7;
  const pool = flexible ? candidates : candidates.filter((c) => c.schedule.doctorId === appointment.doctorId);
  const usable = pool.length > 0 ? pool : candidates;
  if (usable.length === 0) return appointment;

  const best = usable.reduce((a, b) => (new Date(b.slot).getTime() < new Date(a.slot).getTime() ? b : a));
  return {
    ...appointment,
    doctorId: best.schedule.doctorId,
    scheduledTime: best.slot,
    status: 'SCHEDULED',
  };
}

export const erpTriageService = {
  fetchRecommendationQueue,
  calculatePriorityScore,
  rankQueue,
  fetchDoctorSchedules,
  assignSlot,
};
