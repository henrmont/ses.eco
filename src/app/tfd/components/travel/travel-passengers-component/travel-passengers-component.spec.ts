import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelPassengersComponent } from './travel-passengers-component';

describe('TravelPassengersComponent', () => {
  let component: TravelPassengersComponent;
  let fixture: ComponentFixture<TravelPassengersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelPassengersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelPassengersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
