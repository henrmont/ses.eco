import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelMonthData } from './travel-month-data';

describe('TravelMonthData', () => {
  let component: TravelMonthData;
  let fixture: ComponentFixture<TravelMonthData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelMonthData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelMonthData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
