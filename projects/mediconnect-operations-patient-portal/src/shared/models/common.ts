export type Role =
  | 'PATIENT_SOCIAL_SECURITY'
  | 'PATIENT_PRIVATE'
  | 'DOCTOR'
  | 'NURSE'
  | 'SECRETARY';

export type ProfileView = 'patient' | 'doctor' | 'staff';

export type SeverityLevel = 'URGENT' | 'HIGH' | 'MEDIUM' | 'ROUTINE';

export type PatientType = 'SOCIAL_SECURITY' | 'PRIVATE';

export type LoadStatus = 'loading' | 'empty' | 'error' | 'success';

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';
