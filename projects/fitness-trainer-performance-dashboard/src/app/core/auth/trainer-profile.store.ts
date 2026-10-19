import { Injectable, computed, signal } from '@angular/core';

import { TrainerProfile } from '../models/trainer-profile.model';

@Injectable({ providedIn: 'root' })
export class TrainerProfileStore {
  private readonly _profile = signal<TrainerProfile | null>(null);

  readonly profile = this._profile.asReadonly();
  readonly isAuthenticated = computed(() => this._profile() !== null);

  setProfile(profile: TrainerProfile): void {
    this._profile.set(profile);
  }

  clear(): void {
    this._profile.set(null);
  }
}
