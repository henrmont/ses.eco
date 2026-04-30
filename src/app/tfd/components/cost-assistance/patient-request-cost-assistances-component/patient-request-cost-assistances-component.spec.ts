import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRequestCostAssistancesComponent } from './patient-request-cost-assistances-component';

describe('PatientRequestCostAssistancesComponent', () => {
  let component: PatientRequestCostAssistancesComponent;
  let fixture: ComponentFixture<PatientRequestCostAssistancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRequestCostAssistancesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRequestCostAssistancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
