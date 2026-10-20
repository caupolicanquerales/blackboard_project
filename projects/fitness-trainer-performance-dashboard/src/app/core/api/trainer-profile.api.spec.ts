import { TestBed } from '@angular/core/testing';
import { TrainerProfileApi } from './trainer-profile.api';

describe('TrainerProfileApi', () => {
  let service: TrainerProfileApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrainerProfileApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
