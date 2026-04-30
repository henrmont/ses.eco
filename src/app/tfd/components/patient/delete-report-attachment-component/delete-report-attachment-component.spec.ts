import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteReportAttachmentComponent } from './delete-report-attachment-component';

describe('DeleteReportAttachmentComponent', () => {
  let component: DeleteReportAttachmentComponent;
  let fixture: ComponentFixture<DeleteReportAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteReportAttachmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteReportAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
