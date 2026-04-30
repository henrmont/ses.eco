import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPatientEscortComponent } from './show-patient-escort-component';

describe('ShowPatientEscortComponent', () => {
  let component: ShowPatientEscortComponent;
  let fixture: ComponentFixture<ShowPatientEscortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowPatientEscortComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowPatientEscortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
