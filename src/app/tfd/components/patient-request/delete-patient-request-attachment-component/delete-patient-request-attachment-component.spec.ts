import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletePatientRequestAttachmentComponent } from './delete-patient-request-attachment-component';

describe('DeletePatientRequestAttachmentComponent', () => {
  let component: DeletePatientRequestAttachmentComponent;
  let fixture: ComponentFixture<DeletePatientRequestAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletePatientRequestAttachmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletePatientRequestAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
