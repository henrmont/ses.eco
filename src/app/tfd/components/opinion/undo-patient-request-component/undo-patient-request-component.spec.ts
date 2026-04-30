import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UndoPatientRequestComponent } from './undo-patient-request-component';

describe('UndoPatientRequestComponent', () => {
  let component: UndoPatientRequestComponent;
  let fixture: ComponentFixture<UndoPatientRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UndoPatientRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UndoPatientRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
