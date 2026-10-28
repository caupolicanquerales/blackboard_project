import { create } from 'zustand';
import type { LoadStatus, ToastSeverity } from '../../../shared/models/common';
import type { MedicalOrder, PatientRecord, Prescription } from '../../../shared/models/patient';

export interface PatientPortalReminders {
  h24: boolean;
  dayOf: boolean;
}

export interface PatientPortalBanner {
  message: string;
  severity: ToastSeverity;
}

export interface PatientPortalState {
  patient: PatientRecord;
  prescriptions: Prescription[];
  orders: MedicalOrder[];
  status: LoadStatus;
  reminders: PatientPortalReminders;
  banner: PatientPortalBanner | null;
  load: () => Promise<void>;
  refreshPrescriptions: () => Promise<void>;
  toggleReminder: (key: keyof PatientPortalReminders) => void;
  dismissBanner: () => void;
}

const PATIENT_ID = 'patient-001';

const seedPatient: PatientRecord = {
  id: PATIENT_ID,
  fullName: 'María González',
  insuranceType: 'SOCIAL_SECURITY',
  insuranceNumber: 'SS-48291037',
};

const seedPrescriptions = (): Prescription[] => [
  {
    id: 'rx-001',
    patientId: PATIENT_ID,
    medicationName: 'Amoxicillin',
    dosage: '500 mg every 8 hours',
    instructions: 'Take with food for 7 days.',
    pharmacyStatus: 'PENDING',
    issuedAt: '2026-10-26T09:30:00.000Z',
    issuingDoctor: 'Dr. Ricardo Salas',
  },
  {
    id: 'rx-002',
    patientId: PATIENT_ID,
    medicationName: 'Losartan',
    dosage: '50 mg once daily',
    instructions: 'Take in the morning.',
    pharmacyStatus: 'SENT_TO_PHARMACY',
    issuedAt: '2026-10-25T14:00:00.000Z',
    issuingDoctor: 'Dr. Ana Beltrán',
  },
  {
    id: 'rx-003',
    patientId: PATIENT_ID,
    medicationName: 'Ibuprofen',
    dosage: '400 mg as needed',
    instructions: 'Maximum 3 tablets per day.',
    pharmacyStatus: 'READY_FOR_PICKUP',
    issuedAt: '2026-10-24T11:15:00.000Z',
    issuingDoctor: 'Dr. Ricardo Salas',
  },
];

const seedOrders = (): MedicalOrder[] => [
  {
    id: 'ord-001',
    patientId: PATIENT_ID,
    orderType: 'SPECIALIST_REFERRAL',
    description: 'Cardiology consultation',
    targetSpecialty: 'Cardiology',
    status: 'REQUESTED',
  },
  {
    id: 'ord-002',
    patientId: PATIENT_ID,
    orderType: 'LAB_EXAM',
    description: 'Complete blood count',
    targetSpecialty: undefined,
    status: 'SCHEDULED',
  },
];

// Simulated pharmacy progression: each refresh advances one prescription a step.
const nextStatus = (p: Prescription): Prescription['pharmacyStatus'] => {
  if (p.pharmacyStatus === 'PENDING') return 'SENT_TO_PHARMACY';
  if (p.pharmacyStatus === 'SENT_TO_PHARMACY') return 'READY_FOR_PICKUP';
  return p.pharmacyStatus;
};

export const usePatientPortalStore = create<PatientPortalState>()((set, get) => ({
  patient: seedPatient,
  prescriptions: [],
  orders: [],
  status: 'loading',
  reminders: { h24: true, dayOf: true },
  banner: null,

  load: async () => {
    set({ status: 'loading' });
    try {
      const prescriptions = seedPrescriptions();
      const orders = seedOrders();
      set({
        patient: seedPatient,
        prescriptions,
        orders,
        status: prescriptions.length + orders.length === 0 ? 'empty' : 'success',
      });
    } catch {
      set({ status: 'error' });
    }
  },

  refreshPrescriptions: async () => {
    const previous = get().prescriptions;
    const candidate = previous.find((p) => p.pharmacyStatus === 'SENT_TO_PHARMACY') ??
      previous.find((p) => p.pharmacyStatus === 'PENDING');
    if (!candidate) return;

    const updatedStatus = nextStatus(candidate);
    const prescriptions = previous.map((p) =>
      p.id === candidate.id ? { ...p, pharmacyStatus: updatedStatus } : p,
    );
    const becameReady =
      candidate.pharmacyStatus !== 'READY_FOR_PICKUP' && updatedStatus === 'READY_FOR_PICKUP';

    set({
      prescriptions,
      ...(becameReady
        ? {
            banner: {
              message: `${candidate.medicationName} is ready for pickup at the pharmacy.`,
              severity: 'success' as ToastSeverity,
            },
          }
        : {}),
    });
  },

  toggleReminder: (key) =>
    set((state) => ({ reminders: { ...state.reminders, [key]: !state.reminders[key] } })),

  dismissBanner: () => set({ banner: null }),
}));
