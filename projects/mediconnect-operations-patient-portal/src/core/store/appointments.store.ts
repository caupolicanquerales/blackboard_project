import { create } from 'zustand';

import { erpTriageService } from '../services/erp-triage.service';
import type { Appointment, AppointmentStatus, DoctorSchedule } from '../../shared/models/appointment';
import type { LoadStatus } from '../../shared/models/common';

export type AppointmentViewFilter = 'CONSULTATION' | 'SURGICAL_PROCEDURE';

interface AppointmentsState {
  appointments: Appointment[];
  schedules: DoctorSchedule[];
  status: LoadStatus;
  viewFilter: AppointmentViewFilter;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  assignSlot: (id: string) => void;
  modifyAppointment: (id: string, patch: Partial<Omit<Appointment, 'id'>>) => void;
  reassignDoctor: (id: string, doctorId: string) => void;
  updateStatus: (id: string, status: AppointmentStatus) => void;
  setViewFilter: (filter: AppointmentViewFilter) => void;
  requestAppointment: (patientId: string) => void;
}

const FIXTURE_APPOINTMENTS: Appointment[] = [
  {
    id: 'A-001',
    patientId: 'P-101',
    patientName: 'Ana Torres',
    patientType: 'SOCIAL_SECURITY',
    doctorId: 'D-01',
    appointmentType: 'CONSULTATION',
    status: 'PENDING_TRIAGE',
    priorityScore: 9,
    severityLevel: 'URGENT',
    scheduledTime: '',
    durationMinutes: 30,
  },
  {
    id: 'A-002',
    patientId: 'P-102',
    patientName: 'Bruno Díaz',
    patientType: 'PRIVATE',
    doctorId: 'D-02',
    appointmentType: 'SURGICAL_PROCEDURE',
    status: 'PENDING_TRIAGE',
    priorityScore: 7,
    severityLevel: 'HIGH',
    scheduledTime: '',
    durationMinutes: 120,
  },
  {
    id: 'A-003',
    patientId: 'P-103',
    patientName: 'Carla Gómez',
    patientType: 'SOCIAL_SECURITY',
    doctorId: 'D-01',
    appointmentType: 'CONSULTATION',
    status: 'PENDING_TRIAGE',
    priorityScore: 4,
    severityLevel: 'MEDIUM',
    scheduledTime: '',
    durationMinutes: 30,
  },
];

const FIXTURE_SCHEDULES: DoctorSchedule[] = [
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
];

const mapById = (list: Appointment[], id: string, fn: (a: Appointment) => Appointment): Appointment[] =>
  list.map((a) => (a.id === id ? fn(a) : a));

let requestCounter = 0;

export const useAppointmentsStore = create<AppointmentsState>()((set, get) => ({
  appointments: erpTriageService.rankQueue(FIXTURE_APPOINTMENTS),
  schedules: FIXTURE_SCHEDULES,
  status: 'success',
  viewFilter: 'CONSULTATION',

  load: async () => {
    set({ status: 'loading' });
    try {
      const [queue, schedules] = await Promise.all([
        erpTriageService.fetchRecommendationQueue(),
        erpTriageService.fetchDoctorSchedules(),
      ]);
      const appointments = erpTriageService.rankQueue(queue);
      set({ appointments, schedules, status: appointments.length === 0 ? 'empty' : 'success' });
    } catch {
      set({ status: 'error' });
    }
  },

  refresh: () => get().load(),

  assignSlot: (id) => {
    const { appointments, schedules } = get();
    const target = appointments.find((a) => a.id === id);
    if (!target) return;
    const assigned = erpTriageService.assignSlot(target, schedules);
    if (assigned === target) return;
    // Consume the slot so it is not offered again
    const nextSchedules = schedules.map((s) =>
      s.doctorId === assigned.doctorId
        ? { ...s, availableSlots: s.availableSlots.filter((slot) => slot !== assigned.scheduledTime) }
        : s,
    );
    set({ appointments: mapById(appointments, id, () => assigned), schedules: nextSchedules });
  },

  modifyAppointment: (id, patch) =>
    set((state) => ({ appointments: mapById(state.appointments, id, (a) => ({ ...a, ...patch, id: a.id })) })),

  reassignDoctor: (id, doctorId) =>
    set((state) => ({ appointments: mapById(state.appointments, id, (a) => ({ ...a, doctorId })) })),

  updateStatus: (id, status) =>
    set((state) => ({ appointments: mapById(state.appointments, id, (a) => ({ ...a, status })) })),

  setViewFilter: (viewFilter) => set({ viewFilter }),

  requestAppointment: (patientId) => {
    requestCounter += 1;
    const existing = get().appointments.find((a) => a.patientId === patientId);
    const appointment: Appointment = {
      id: `REQ-${Date.now()}-${requestCounter}`,
      patientId,
      patientName: existing?.patientName ?? patientId,
      patientType: existing?.patientType ?? 'SOCIAL_SECURITY',
      doctorId: existing?.doctorId ?? '',
      appointmentType: 'CONSULTATION',
      status: 'PENDING_TRIAGE',
      priorityScore: erpTriageService.calculatePriorityScore('ROUTINE'),
      severityLevel: 'ROUTINE',
      scheduledTime: '',
      durationMinutes: 30,
    };
    set((state) => ({
      appointments: erpTriageService.rankQueue([...state.appointments, appointment]),
      status: 'success',
    }));
  },
}));
