import { TestBed } from '@angular/core/testing';

import { PatientRequestService } from './patient-request-service';

describe('PatientRequestService', () => {
  let service: PatientRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatientRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
