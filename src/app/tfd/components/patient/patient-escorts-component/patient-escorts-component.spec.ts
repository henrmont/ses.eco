import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientEscortsComponent } from './patient-escorts-component';

describe('PatientEscortsComponent', () => {
  let component: PatientEscortsComponent;
  let fixture: ComponentFixture<PatientEscortsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientEscortsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientEscortsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
