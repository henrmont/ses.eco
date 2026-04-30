import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePatientRequestAttachmentComponent } from './create-patient-request-attachment-component';

describe('CreatePatientRequestAttachmentComponent', () => {
  let component: CreatePatientRequestAttachmentComponent;
  let fixture: ComponentFixture<CreatePatientRequestAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePatientRequestAttachmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePatientRequestAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
