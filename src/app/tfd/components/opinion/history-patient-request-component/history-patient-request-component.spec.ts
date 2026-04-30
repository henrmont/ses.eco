import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryPatientRequestComponent } from './history-patient-request-component';

describe('HistoryPatientRequestComponent', () => {
  let component: HistoryPatientRequestComponent;
  let fixture: ComponentFixture<HistoryPatientRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryPatientRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryPatientRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
