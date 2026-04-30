import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessPatientRequestToSocialComponent } from './process-patient-request-to-social-component';

describe('ProcessPatientRequestToSocialComponent', () => {
  let component: ProcessPatientRequestToSocialComponent;
  let fixture: ComponentFixture<ProcessPatientRequestToSocialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessPatientRequestToSocialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessPatientRequestToSocialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
