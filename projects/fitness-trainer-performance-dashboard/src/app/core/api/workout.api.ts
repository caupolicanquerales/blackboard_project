import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PhaseProgress } from '../models/phase-progress.model';
import { WorkoutStep } from '../models/workout-step.model';

@Injectable({ providedIn: 'root' })
export class WorkoutApi {
  private readonly http = inject(HttpClient);

  getSteps(routineId: string): Observable<WorkoutStep[]> {
    return this.http.get<WorkoutStep[]>(`/api/routines/${routineId}/steps`);
  }

  getPhases(): Observable<PhaseProgress[]> {
    return this.http.get<PhaseProgress[]>('/api/phases');
  }

  completeStep(id: string): Observable<WorkoutStep> {
    return this.http.post<WorkoutStep>(`/api/steps/${id}/complete`, {});
  }

  advancePhase(): Observable<PhaseProgress[]> {
    return this.http.post<PhaseProgress[]>('/api/phases/advance', {});
  }
}
