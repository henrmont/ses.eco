import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovePatientRequestFromOthersComponent } from './move-patient-request-from-others-component';

describe('MovePatientRequestFromOthersComponent', () => {
  let component: MovePatientRequestFromOthersComponent;
  let fixture: ComponentFixture<MovePatientRequestFromOthersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovePatientRequestFromOthersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovePatientRequestFromOthersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
