import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HospitalUnitiesPage } from './hospital-unities-page';

describe('HospitalUnitiesPage', () => {
  let component: HospitalUnitiesPage;
  let fixture: ComponentFixture<HospitalUnitiesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospitalUnitiesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HospitalUnitiesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
