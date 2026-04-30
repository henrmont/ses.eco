import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletePatientReportComponent } from './delete-patient-report-component';

describe('DeletePatientReportComponent', () => {
  let component: DeletePatientReportComponent;
  let fixture: ComponentFixture<DeletePatientReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletePatientReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletePatientReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
