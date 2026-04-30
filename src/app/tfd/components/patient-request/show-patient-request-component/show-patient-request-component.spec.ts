import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPatientRequestComponent } from './show-patient-request-component';

describe('ShowPatientRequestComponent', () => {
  let component: ShowPatientRequestComponent;
  let fixture: ComponentFixture<ShowPatientRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowPatientRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowPatientRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
