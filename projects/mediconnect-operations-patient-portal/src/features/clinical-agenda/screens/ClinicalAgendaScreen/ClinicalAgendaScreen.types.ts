import type { Appointment } from '../../../../shared/models/appointment';

export type ClinicalAgendaViewState = 'loading' | 'empty' | 'error' | 'success';

export type CalendarRange = 'day' | 'week';

export type ClinicalAgendaToast = {
  id: string;
  message: string;
};

export type AgendaItem = Appointment;
