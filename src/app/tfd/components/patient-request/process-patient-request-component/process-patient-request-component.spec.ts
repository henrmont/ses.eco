import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessPatientRequestComponent } from './process-patient-request-component';

describe('ProcessPatientRequestComponent', () => {
  let component: ProcessPatientRequestComponent;
  let fixture: ComponentFixture<ProcessPatientRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessPatientRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessPatientRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
