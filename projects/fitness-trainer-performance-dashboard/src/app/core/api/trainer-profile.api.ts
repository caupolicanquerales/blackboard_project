import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrainerProfile } from '../models/trainer-profile.model';

@Service()
export class TrainerProfileApi {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<TrainerProfile> {
    return this.http.get<TrainerProfile>('/api/trainer/profile');
  }
}
