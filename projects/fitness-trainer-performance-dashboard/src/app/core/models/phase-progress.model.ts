export type PhaseStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface PhaseProgress {
  id: string;
  phaseName: string;
  completionPercentage: number;
  status: PhaseStatus;
}
