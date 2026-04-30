import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialistCareData } from './specialist-care-data';

describe('SpecialistCareData', () => {
  let component: SpecialistCareData;
  let fixture: ComponentFixture<SpecialistCareData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialistCareData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialistCareData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
