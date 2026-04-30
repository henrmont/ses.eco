import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateTravelComponent } from './update-travel-component';

describe('UpdateTravelComponent', () => {
  let component: UpdateTravelComponent;
  let fixture: ComponentFixture<UpdateTravelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateTravelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateTravelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
