import { Injectable, signal } from '@angular/core';
import { TrainerProfile } from '../models/trainer-profile.model';

@Injectable({ providedIn: 'root' })
export class TrainerProfileStore {
  private readonly _profile = signal<TrainerProfile | null>(null);
  private readonly _status = signal<'loading' | 'success'>('loading');

  readonly profile = this._profile.asReadonly();
  readonly status = this._status.asReadonly();

  setProfile(profile: TrainerProfile): void {
    this._profile.set(profile);
    this._status.set('success');
  }
}
