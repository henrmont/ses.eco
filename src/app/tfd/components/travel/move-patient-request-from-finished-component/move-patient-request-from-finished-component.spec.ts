import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovePatientRequestFromFinishedComponent } from './move-patient-request-from-finished-component';

describe('MovePatientRequestFromFinishedComponent', () => {
  let component: MovePatientRequestFromFinishedComponent;
  let fixture: ComponentFixture<MovePatientRequestFromFinishedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovePatientRequestFromFinishedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovePatientRequestFromFinishedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
