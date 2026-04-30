import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePatientEscortComponent } from './create-patient-escort-component';

describe('CreatePatientEscortComponent', () => {
  let component: CreatePatientEscortComponent;
  let fixture: ComponentFixture<CreatePatientEscortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePatientEscortComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePatientEscortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
