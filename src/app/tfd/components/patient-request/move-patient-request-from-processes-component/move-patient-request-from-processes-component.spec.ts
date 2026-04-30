import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovePatientRequestFromProcessesComponent } from './move-patient-request-from-processes-component';

describe('MovePatientRequestFromProcessesComponent', () => {
  let component: MovePatientRequestFromProcessesComponent;
  let fixture: ComponentFixture<MovePatientRequestFromProcessesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovePatientRequestFromProcessesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovePatientRequestFromProcessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
