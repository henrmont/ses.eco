import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePatientEscortComponent } from './update-patient-escort-component';

describe('UpdatePatientEscortComponent', () => {
  let component: UpdatePatientEscortComponent;
  let fixture: ComponentFixture<UpdatePatientEscortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePatientEscortComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePatientEscortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
