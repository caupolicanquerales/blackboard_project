import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { PhaseProgress, WorkoutStep } from '../../../shared/models/workout.model';
import { TrainingRatio } from './dashboard.model';

@Service()
export class DashboardApi {
  private readonly http = inject(HttpClient);

  getRatios(): Observable<TrainingRatio[]> {
    return this.http.get<TrainingRatio[]>('/api/dashboard/ratios');
  }

  getSteps(): Observable<WorkoutStep[]> {
    return this.http.get<WorkoutStep[]>('/api/routines/default/steps');
  }

  getPhases(): Observable<PhaseProgress[]> {
    return this.http.get<PhaseProgress[]>('/api/routines/default/phases');
  }
}
