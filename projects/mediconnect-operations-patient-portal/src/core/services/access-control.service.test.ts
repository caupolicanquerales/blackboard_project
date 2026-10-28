import { accessControlService as svc } from './access-control.service';

describe('accessControlService', () => {
  it('maps profile views', () => {
    expect(svc.getProfileView('PATIENT_PRIVATE')).toBe('patient');
    expect(svc.getProfileView('DOCTOR')).toBe('doctor');
    expect(svc.getProfileView('NURSE')).toBe('staff');
    expect(svc.getProfileView('SECRETARY')).toBe('staff');
  });

  it('returns tabs per role', () => {
    expect(svc.getTabsForRole('PATIENT_SOCIAL_SECURITY')).toEqual(['PatientPortal']);
    expect(svc.getTabsForRole('NURSE')).toEqual(['ClinicalAgenda', 'MessagingHub']);
    expect(svc.getTabsForRole('SECRETARY')).toContain('FinancialLedger');
  });

  it('enforces field-level access', () => {
    expect(svc.canAccessField('PATIENT_PRIVATE', 'patient', 'name')).toBe(false);
    expect(svc.canAccessField('PATIENT_PRIVATE', 'patient', 'name', { isOwnRecord: true })).toBe(true);
    expect(svc.canAccessField('PATIENT_PRIVATE', 'financial', 'balance', { isOwnRecord: true })).toBe(false);
    expect(svc.canAccessField('NURSE', 'prescription', 'dose', { write: true })).toBe(false);
    expect(svc.canAccessField('DOCTOR', 'prescription', 'dose', { write: true })).toBe(true);
    expect(svc.canAccessField('NURSE', 'appointment', 'reschedule')).toBe(false);
    expect(svc.canAccessField('SECRETARY', 'appointment', 'reschedule')).toBe(true);
    expect(svc.canAccessField('DOCTOR', 'financial', 'amount')).toBe(false);
    expect(svc.canAccessField('SECRETARY', 'financial', 'amount')).toBe(true);
  });

  it('creates a session', () => {
    const s = svc.createSession('DOCTOR');
    expect(s.profileView).toBe('doctor');
    expect(s.tabs).toEqual(['ClinicalAgenda', 'MessagingHub']);
  });
});
