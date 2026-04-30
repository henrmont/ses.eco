import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HaltedPatientRequestComponent } from './halted-patient-request-component';

describe('HaltedPatientRequestComponent', () => {
  let component: HaltedPatientRequestComponent;
  let fixture: ComponentFixture<HaltedPatientRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HaltedPatientRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HaltedPatientRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
