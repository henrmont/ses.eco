import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePatientReportComponent } from './create-patient-report-component';

describe('CreatePatientReportComponent', () => {
  let component: CreatePatientReportComponent;
  let fixture: ComponentFixture<CreatePatientReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePatientReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePatientReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
