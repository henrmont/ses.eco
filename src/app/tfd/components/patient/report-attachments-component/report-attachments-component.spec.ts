import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportAttachmentsComponent } from './report-attachments-component';

describe('ReportAttachmentsComponent', () => {
  let component: ReportAttachmentsComponent;
  let fixture: ComponentFixture<ReportAttachmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportAttachmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportAttachmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
