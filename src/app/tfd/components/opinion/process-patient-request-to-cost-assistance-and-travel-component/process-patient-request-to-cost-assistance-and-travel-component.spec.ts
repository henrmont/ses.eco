import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessPatientRequestToCostAssistanceAndTravelComponent } from './process-patient-request-to-cost-assistance-and-travel-component';

describe('ProcessPatientRequestToCostAssistanceAndTravelComponent', () => {
  let component: ProcessPatientRequestToCostAssistanceAndTravelComponent;
  let fixture: ComponentFixture<ProcessPatientRequestToCostAssistanceAndTravelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessPatientRequestToCostAssistanceAndTravelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessPatientRequestToCostAssistanceAndTravelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
