import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletePatientEscortComponent } from './delete-patient-escort-component';

describe('DeletePatientEscortComponent', () => {
  let component: DeletePatientEscortComponent;
  let fixture: ComponentFixture<DeletePatientEscortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletePatientEscortComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletePatientEscortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
