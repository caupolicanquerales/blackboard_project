import type { AppointmentStatus } from '../../models/appointment';

export type AppointmentStatusTimelineProps = {
  status: AppointmentStatus;
};

export type TimelineStepState = 'completed' | 'current' | 'upcoming';
