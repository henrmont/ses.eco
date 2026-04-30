import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovePatientRequestFromHistoryComponent } from './move-patient-request-from-history-component';

describe('MovePatientRequestFromHistoryComponent', () => {
  let component: MovePatientRequestFromHistoryComponent;
  let fixture: ComponentFixture<MovePatientRequestFromHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovePatientRequestFromHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovePatientRequestFromHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
