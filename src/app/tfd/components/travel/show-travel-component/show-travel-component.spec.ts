import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTravelComponent } from './show-travel-component';

describe('ShowTravelComponent', () => {
  let component: ShowTravelComponent;
  let fixture: ComponentFixture<ShowTravelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowTravelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowTravelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
