import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePatientRequestComponent } from './update-patient-request-component';

describe('UpdatePatientRequestComponent', () => {
  let component: UpdatePatientRequestComponent;
  let fixture: ComponentFixture<UpdatePatientRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePatientRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePatientRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
