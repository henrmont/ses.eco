import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRequestAccountabilitiesComponent } from './patient-request-accountabilities-component';

describe('PatientRequestAccountabilitiesComponent', () => {
  let component: PatientRequestAccountabilitiesComponent;
  let fixture: ComponentFixture<PatientRequestAccountabilitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRequestAccountabilitiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRequestAccountabilitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
