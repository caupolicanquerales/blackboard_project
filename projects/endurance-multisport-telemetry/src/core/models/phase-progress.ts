import type { PhaseStatus } from './phase-progress-status';

export interface PhaseProgress {
  id: string;
  phaseName: string;
  completionPercentage: number;
  status: PhaseStatus;
}
