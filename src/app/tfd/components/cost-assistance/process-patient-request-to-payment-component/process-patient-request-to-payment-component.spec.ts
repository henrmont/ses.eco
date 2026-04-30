import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessPatientRequestToPaymentComponent } from './process-patient-request-to-payment-component';

describe('ProcessPatientRequestToPaymentComponent', () => {
  let component: ProcessPatientRequestToPaymentComponent;
  let fixture: ComponentFixture<ProcessPatientRequestToPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessPatientRequestToPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessPatientRequestToPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
