import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePatientReportComponent } from './update-patient-report-component';

describe('UpdatePatientReportComponent', () => {
  let component: UpdatePatientReportComponent;
  let fixture: ComponentFixture<UpdatePatientReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePatientReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePatientReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
