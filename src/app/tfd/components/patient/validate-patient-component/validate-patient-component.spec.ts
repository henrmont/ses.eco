import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidatePatientComponent } from './validate-patient-component';

describe('ValidatePatientComponent', () => {
  let component: ValidatePatientComponent;
  let fixture: ComponentFixture<ValidatePatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidatePatientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidatePatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
