import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRequestsPage } from './patient-requests-page';

describe('PatientRequestsPage', () => {
  let component: PatientRequestsPage;
  let fixture: ComponentFixture<PatientRequestsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRequestsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRequestsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
