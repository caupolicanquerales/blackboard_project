import type { StepState } from './step-state';

export interface TimelineStep {
  id: string;
  label: string;
  state: StepState;
}
