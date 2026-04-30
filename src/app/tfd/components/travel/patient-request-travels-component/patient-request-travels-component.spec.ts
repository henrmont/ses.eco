import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRequestTravelsComponent } from './patient-request-travels-component';

describe('PatientRequestTravelsComponent', () => {
  let component: PatientRequestTravelsComponent;
  let fixture: ComponentFixture<PatientRequestTravelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRequestTravelsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRequestTravelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
