import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelRoutesComponent } from './travel-routes-component';

describe('TravelRoutesComponent', () => {
  let component: TravelRoutesComponent;
  let fixture: ComponentFixture<TravelRoutesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelRoutesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
