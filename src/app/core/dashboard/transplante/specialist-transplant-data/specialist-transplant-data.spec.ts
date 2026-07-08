import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialistTransplantData } from './specialist-transplant-data';

describe('SpecialistTransplantData', () => {
  let component: SpecialistTransplantData;
  let fixture: ComponentFixture<SpecialistTransplantData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialistTransplantData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialistTransplantData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
