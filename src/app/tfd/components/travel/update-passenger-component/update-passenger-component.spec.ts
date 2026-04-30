import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePassengerComponent } from './update-passenger-component';

describe('UpdatePassengerComponent', () => {
  let component: UpdatePassengerComponent;
  let fixture: ComponentFixture<UpdatePassengerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePassengerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePassengerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
