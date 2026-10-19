import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

import { TrainerProfileStore } from '../auth/trainer-profile.store';
import { TrainerProfile } from '../models/trainer-profile.model';

const AVATAR_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>" +
  "<rect width='64' height='64' rx='32' fill='#1f2a44'/>" +
  "<circle cx='32' cy='24' r='11' fill='#e8ecf4'/>" +
  "<path d='M10 56c2-12 12-18 22-18s20 6 22 18z' fill='#e8ecf4'/></svg>";

const SEED_PROFILE: TrainerProfile = {
  id: 'trainer-1',
  displayName: 'Alex Carter',
  headline: 'PERSONAL TRAINER',
  websiteUrl: 'www.fitnesstrainer.com',
  avatarUrl: `data:image/svg+xml;utf8,${encodeURIComponent(AVATAR_SVG)}`,
  role: 'TRAINER',
};

export function provideDevSeed(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(TrainerProfileStore).setProfile(SEED_PROFILE);
  });
}
