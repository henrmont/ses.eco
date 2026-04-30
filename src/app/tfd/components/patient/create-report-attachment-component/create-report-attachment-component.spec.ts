import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateReportAttachmentComponent } from './create-report-attachment-component';

describe('CreateReportAttachmentComponent', () => {
  let component: CreateReportAttachmentComponent;
  let fixture: ComponentFixture<CreateReportAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateReportAttachmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateReportAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
