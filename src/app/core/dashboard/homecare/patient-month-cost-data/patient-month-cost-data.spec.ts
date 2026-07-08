import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientMonthCostData } from './patient-month-cost-data';

describe('PatientMonthCostData', () => {
  let component: PatientMonthCostData;
  let fixture: ComponentFixture<PatientMonthCostData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientMonthCostData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientMonthCostData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
