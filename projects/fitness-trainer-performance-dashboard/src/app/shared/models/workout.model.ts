export interface WorkoutStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  isCompleted: boolean;
}

export type PhaseStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface PhaseProgress {
  id: string;
  phaseName: string;
  completionPercentage: number;
  status: PhaseStatus;
}

export type ViewState = 'loading' | 'empty' | 'error' | 'success';
