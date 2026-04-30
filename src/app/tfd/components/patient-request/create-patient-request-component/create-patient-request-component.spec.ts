import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePatientRequestComponent } from './create-patient-request-component';

describe('CreatePatientRequestComponent', () => {
  let component: CreatePatientRequestComponent;
  let fixture: ComponentFixture<CreatePatientRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePatientRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePatientRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
