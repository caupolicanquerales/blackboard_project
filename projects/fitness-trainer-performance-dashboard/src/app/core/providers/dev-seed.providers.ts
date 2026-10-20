import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { BiometricTelemetryService } from '../biometrics/biometric-telemetry.service';
import { TrainerProfileStore } from '../profile/trainer-profile.store';

export function provideDevSeed(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(TrainerProfileStore).load();
    const telemetry = inject(BiometricTelemetryService);
    telemetry.loadSnapshot();
    telemetry.startStream();
  });
}
