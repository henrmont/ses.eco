import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateAccountabilityDailyComponent } from './update-accountability-daily-component';

describe('UpdateAccountabilityDailyComponent', () => {
  let component: UpdateAccountabilityDailyComponent;
  let fixture: ComponentFixture<UpdateAccountabilityDailyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateAccountabilityDailyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateAccountabilityDailyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
