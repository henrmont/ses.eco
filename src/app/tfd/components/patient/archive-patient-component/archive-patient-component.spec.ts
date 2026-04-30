import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivePatientComponent } from './archive-patient-component';

describe('ArchivePatientComponent', () => {
  let component: ArchivePatientComponent;
  let fixture: ComponentFixture<ArchivePatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivePatientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchivePatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
