import { Injectable, Signal, inject, signal } from '@angular/core';
import { TrainerProfileApi } from '../api/trainer-profile.api';
import { TrainerProfile } from '../models/trainer-profile.model';

@Injectable({ providedIn: 'root' })
export class TrainerProfileStore {
  private readonly api = inject(TrainerProfileApi);

  private readonly _profile = signal<TrainerProfile | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly profile: Signal<TrainerProfile | null> = this._profile.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();

  load(): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.getProfile().subscribe({
      next: (profile) => {
        this._profile.set(profile);
        this._loading.set(false);
      },
      error: (err: unknown) => {
        this._error.set(err instanceof Error ? err.message : 'Failed to load trainer profile');
        this._loading.set(false);
      },
    });
  }
}
