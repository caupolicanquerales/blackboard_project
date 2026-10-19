import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { PhaseProgress, WorkoutStep } from '../../../shared/models/workout.model';

@Service()
export class RoutinesApi {
  private readonly http = inject(HttpClient);

  getSteps(routineId: string): Observable<WorkoutStep[]> {
    return this.http.get<WorkoutStep[]>(`/api/routines/${routineId}/steps`);
  }

  getPhases(routineId: string): Observable<PhaseProgress[]> {
    return this.http.get<PhaseProgress[]>(`/api/routines/${routineId}/phases`);
  }

  completeStep(routineId: string, stepId: string): Observable<WorkoutStep> {
    return this.http.post<WorkoutStep>(`/api/routines/${routineId}/steps/${stepId}/complete`, {});
  }

  advancePhase(routineId: string): Observable<PhaseProgress[]> {
    return this.http.post<PhaseProgress[]>(`/api/routines/${routineId}/advance`, {});
  }
}
