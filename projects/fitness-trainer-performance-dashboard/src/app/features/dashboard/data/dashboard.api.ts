import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrainingRatio } from './training-ratio.model';
import { PhaseProgress } from '../../../shared/models/phase-progress.model';
import { WorkoutStep } from '../../../shared/models/workout-step.model';

@Service()
export class DashboardApi {
  private readonly http = inject(HttpClient);

  getTrainingRatios(): Observable<TrainingRatio[]> {
    return this.http.get<TrainingRatio[]>('/api/training-ratios');
  }

  resetTrainingRatios(): Observable<TrainingRatio[]> {
    return this.http.post<TrainingRatio[]>('/api/training-ratios/reset', {});
  }

  getPhases(): Observable<PhaseProgress[]> {
    return this.http.get<PhaseProgress[]>('/api/phases');
  }

  getSteps(routineId: string): Observable<WorkoutStep[]> {
    return this.http.get<WorkoutStep[]>(`/api/routines/${encodeURIComponent(routineId)}/steps`);
  }
}
