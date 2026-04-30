import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinishPatientRequestPaymentComponent } from './finish-patient-request-payment-component';

describe('FinishPatientRequestPaymentComponent', () => {
  let component: FinishPatientRequestPaymentComponent;
  let fixture: ComponentFixture<FinishPatientRequestPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinishPatientRequestPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinishPatientRequestPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
