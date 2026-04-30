import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovePatientFromOthersComponent } from './move-patient-from-others-component';

describe('MovePatientFromOthersComponent', () => {
  let component: MovePatientFromOthersComponent;
  let fixture: ComponentFixture<MovePatientFromOthersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovePatientFromOthersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovePatientFromOthersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
