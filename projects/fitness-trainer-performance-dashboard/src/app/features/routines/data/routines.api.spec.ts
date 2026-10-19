import { TestBed } from '@angular/core/testing';
import { RoutinesApi } from './routines.api';

describe('RoutinesApi', () => {
  let service: RoutinesApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoutinesApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
