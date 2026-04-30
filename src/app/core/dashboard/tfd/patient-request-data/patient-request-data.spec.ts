import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRequestData } from './patient-request-data';

describe('PatientRequestData', () => {
  let component: PatientRequestData;
  let fixture: ComponentFixture<PatientRequestData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRequestData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRequestData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
