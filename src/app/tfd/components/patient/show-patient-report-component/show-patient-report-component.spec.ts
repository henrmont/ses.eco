import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPatientReportComponent } from './show-patient-report-component';

describe('ShowPatientReportComponent', () => {
  let component: ShowPatientReportComponent;
  let fixture: ComponentFixture<ShowPatientReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowPatientReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowPatientReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
