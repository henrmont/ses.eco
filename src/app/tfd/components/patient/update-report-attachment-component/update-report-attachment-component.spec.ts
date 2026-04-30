import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateReportAttachmentComponent } from './update-report-attachment-component';

describe('UpdateReportAttachmentComponent', () => {
  let component: UpdateReportAttachmentComponent;
  let fixture: ComponentFixture<UpdateReportAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateReportAttachmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateReportAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
