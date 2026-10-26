import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { mockBackendInterceptor } from './mock-backend.interceptor';
import { TrainerProfileStore } from '../state/trainer-profile.store';
import { WorkoutStore } from '../state/workout.store';

const AVATAR_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
      '<rect width="96" height="96" rx="48" fill="#2b2f3a"/>' +
      '<circle cx="48" cy="38" r="16" fill="#9aa4b8"/>' +
      '<path d="M16 88c4-20 18-28 32-28s28 8 32 28z" fill="#9aa4b8"/></svg>',
  );

export function provideMockBackend(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withInterceptors([mockBackendInterceptor])),
    provideAppInitializer(() => {
      inject(TrainerProfileStore).setProfile({
        id: 'trainer-1',
        displayName: 'Alex Morgan',
        headline: 'PERSONAL TRAINER',
        websiteUrl: 'https://www.alexmorgan.fit',
        avatarUrl: AVATAR_DATA_URI,
        avatarAlt: 'Portrait of Alex Morgan',
      });
      inject(WorkoutStore).loadRoutine('default');
    }),
  ]);
}
