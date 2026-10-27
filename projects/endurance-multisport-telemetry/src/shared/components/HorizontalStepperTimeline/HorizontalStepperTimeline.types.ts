import type { TimelineStep } from '../../models/timeline-step';

export type HorizontalStepperTimelineProps = {
  steps: TimelineStep[];
  onPressStep: (id: string) => void;
};
