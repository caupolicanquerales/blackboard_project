import type { ProfileView, Role } from '../../shared/models/common';

export type TabRouteName =
  | 'PatientPortal'
  | 'ClinicalAgenda'
  | 'MessagingHub'
  | 'FinancialLedger';

export type AccessResource =
  | 'patient'
  | 'appointment'
  | 'prescription'
  | 'message'
  | 'financial';

export interface AccessSession {
  role: Role;
  profileView: ProfileView;
  tabs: TabRouteName[];
  createdAt: string;
}

export interface AccessContext {
  /** True when the record belongs to the current user (relevant for patients). */
  isOwnRecord?: boolean;
  /** True to check write access instead of read access. */
  write?: boolean;
}

const PATIENT_ROLES: readonly Role[] = ['PATIENT_SOCIAL_SECURITY', 'PATIENT_PRIVATE'];

const FINANCIAL_FIELDS: readonly string[] = [
  'balance',
  'invoice',
  'invoices',
  'payment',
  'payments',
  'amount',
  'copay',
  'charges',
  'insurance',
  'billing',
];

const isPatient = (role: Role): boolean => PATIENT_ROLES.includes(role);

const getProfileView = (role: Role): ProfileView => {
  if (isPatient(role)) return 'patient';
  if (role === 'DOCTOR') return 'doctor';
  return 'staff';
};

const getTabsForRole = (role: Role): TabRouteName[] => {
  switch (role) {
    case 'DOCTOR':
    case 'NURSE':
      return ['ClinicalAgenda', 'MessagingHub'];
    case 'SECRETARY':
      return ['ClinicalAgenda', 'MessagingHub', 'FinancialLedger'];
    default:
      return ['PatientPortal'];
  }
};

const canAccessField = (
  role: Role,
  resource: AccessResource | string,
  field: string,
  context: AccessContext = {},
): boolean => {
  const normalizedField = field.toLowerCase();
  const isFinancial =
    resource === 'financial' || FINANCIAL_FIELDS.includes(normalizedField);

  if (isFinancial) return role === 'SECRETARY';

  if (isPatient(role)) {
    // Patients only read their own non-financial data.
    return context.isOwnRecord === true && !context.write;
  }

  if (normalizedField === 'reschedule') {
    return role === 'DOCTOR' || role === 'SECRETARY';
  }

  if (resource === 'prescription' && context.write) {
    return role === 'DOCTOR';
  }

  return true;
};

const createSession = (role: Role): AccessSession => ({
  role,
  profileView: getProfileView(role),
  tabs: getTabsForRole(role),
  createdAt: new Date().toISOString(),
});

export const accessControlService = {
  getProfileView,
  getTabsForRole,
  canAccessField,
  createSession,
};
