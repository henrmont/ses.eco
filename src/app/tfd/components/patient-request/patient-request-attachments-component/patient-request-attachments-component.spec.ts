import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRequestAttachmentsComponent } from './patient-request-attachments-component';

describe('PatientRequestAttachmentsComponent', () => {
  let component: PatientRequestAttachmentsComponent;
  let fixture: ComponentFixture<PatientRequestAttachmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRequestAttachmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRequestAttachmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
