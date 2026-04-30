import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinishPatientRequestAccountabilityComponent } from './finish-patient-request-accountability-component';

describe('FinishPatientRequestAccountabilityComponent', () => {
  let component: FinishPatientRequestAccountabilityComponent;
  let fixture: ComponentFixture<FinishPatientRequestAccountabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinishPatientRequestAccountabilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinishPatientRequestAccountabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
