import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinishPatientRequestTravelComponent } from './finish-patient-request-travel-component';

describe('FinishPatientRequestTravelComponent', () => {
  let component: FinishPatientRequestTravelComponent;
  let fixture: ComponentFixture<FinishPatientRequestTravelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinishPatientRequestTravelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinishPatientRequestTravelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
