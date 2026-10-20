import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PhaseProgress } from '../../../shared/models/phase-progress.model';
import { WorkoutStep } from '../../../shared/models/workout-step.model';

@Service()
export class RoutinesApi {
  private readonly http = inject(HttpClient);

  getSteps(routineId: string): Observable<WorkoutStep[]> {
    return this.http.get<WorkoutStep[]>(`/api/routines/${routineId}/steps`);
  }

  completeStep(routineId: string, stepId: string): Observable<WorkoutStep> {
    return this.http.post<WorkoutStep>(`/api/routines/${routineId}/steps/${stepId}/complete`, {});
  }

  getPhases(): Observable<PhaseProgress[]> {
    return this.http.get<PhaseProgress[]>('/api/phases');
  }

  advancePhase(): Observable<PhaseProgress[]> {
    return this.http.post<PhaseProgress[]>('/api/phases/advance', {});
  }
}
