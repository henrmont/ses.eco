import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePatientRequestAttachmentComponent } from './update-patient-request-attachment-component';

describe('UpdatePatientRequestAttachmentComponent', () => {
  let component: UpdatePatientRequestAttachmentComponent;
  let fixture: ComponentFixture<UpdatePatientRequestAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePatientRequestAttachmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePatientRequestAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
