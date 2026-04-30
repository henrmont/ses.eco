import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletePatientRequestComponent } from './delete-patient-request-component';

describe('DeletePatientRequestComponent', () => {
  let component: DeletePatientRequestComponent;
  let fixture: ComponentFixture<DeletePatientRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletePatientRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletePatientRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
