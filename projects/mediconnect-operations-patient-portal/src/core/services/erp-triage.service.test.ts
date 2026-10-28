import { erpTriageService as svc } from './erp-triage.service';

describe('erpTriageService', () => {
  it('returns a mixed seeded queue', async () => {
    const q = await svc.fetchRecommendationQueue();
    expect(q).toHaveLength(10);
    expect(new Set(q.map((a) => a.patientType))).toEqual(new Set(['SOCIAL_SECURITY', 'PRIVATE']));
    expect(new Set(q.map((a) => a.appointmentType)).size).toBe(2);
    expect(new Set(q.map((a) => a.severityLevel)).size).toBe(4);
  });

  it('calculates and clamps scores', () => {
    expect(svc.calculatePriorityScore('URGENT', '')).toBe(9);
    expect(svc.calculatePriorityScore('HIGH', '')).toBe(7);
    expect(svc.calculatePriorityScore('MEDIUM', '')).toBe(4);
    expect(svc.calculatePriorityScore('ROUTINE', '')).toBe(1);
    expect(svc.calculatePriorityScore('URGENT', 'cardiac cancer')).toBe(10);
    expect(svc.calculatePriorityScore('ROUTINE', 'routine checkup follow-up')).toBeGreaterThanOrEqual(0);
  });

  it('ranks by score descending without mutating', async () => {
    const q = await svc.fetchRecommendationQueue();
    const ranked = svc.rankQueue(q);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].priorityScore).toBeGreaterThanOrEqual(ranked[i].priorityScore);
    }
    expect(q[0].id).toBe('A-001');
  });

  it('assigns the earliest free slot', async () => {
    const [q, schedules] = await Promise.all([svc.fetchRecommendationQueue(), svc.fetchDoctorSchedules()]);
    const urgent = q.find((a) => a.id === 'A-001')!;
    const out = svc.assignSlot(urgent, schedules);
    expect(out.scheduledTime).toBe('2026-11-02T08:00:00Z');
    expect(out.doctorId).toBe('D-02');
    expect(out.status).toBe('SCHEDULED');

    const routine = q.find((a) => a.id === 'A-004')!;
    expect(svc.assignSlot(routine, schedules).doctorId).toBe('D-03');
  });

  it('returns appointment unchanged when no slots', async () => {
    const q = await svc.fetchRecommendationQueue();
    expect(svc.assignSlot(q[0], [])).toBe(q[0]);
  });
});
