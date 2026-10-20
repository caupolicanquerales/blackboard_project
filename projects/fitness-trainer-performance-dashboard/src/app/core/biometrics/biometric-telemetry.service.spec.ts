import { TestBed } from '@angular/core/testing';
import { BiometricTelemetryService } from './biometric-telemetry.service';

describe('BiometricTelemetryService', () => {
  let service: BiometricTelemetryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BiometricTelemetryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
